import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { generateInvoiceWorkflow } from "../../../../../workflows/generate-invoice";

/**
 * GET /store/orders/:id/invoice
 *
 * Get invoice information for an order
 * Requires customer authentication
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const orderId = req.params.id;
    const customerId = (req as any).auth_context?.actor_id;

    if (!customerId) {
      res.status(401).json({
        message: "Unauthorized. Please log in to view invoices.",
      });
      return;
    }

    // Verify order belongs to customer
    const orderModuleService = req.scope.resolve(Modules.ORDER);
    const order = await orderModuleService.retrieveOrder(orderId);

    if (!order) {
      res.status(404).json({
        message: "Order not found",
      });
      return;
    }

    if (order.customer_id !== customerId) {
      res.status(403).json({
        message: "You don't have permission to view this invoice",
      });
      return;
    }

    // Get invoice
    const invoiceService = req.scope.resolve("invoice_generator");
    let invoice = await invoiceService.getInvoiceByOrderId(orderId);

    // If no invoice exists, generate one
    if (!invoice) {
      console.log(
        `[Invoice API] No invoice found for order ${orderId}, generating...`,
      );

      const { result } = await generateInvoiceWorkflow(req.scope).run({
        input: { orderId },
      });

      invoice = result.invoice;
    }

    res.json({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        order_id: invoice.order_id,
        pdf_url: invoice.pdf_url,
        status: invoice.status,
        generated_at: invoice.generated_at,
      },
    });
  } catch (error: any) {
    console.error("[Invoice API] Error:", error);
    res.status(500).json({
      message: "Failed to retrieve invoice",
      error: error.message,
    });
  }
}
