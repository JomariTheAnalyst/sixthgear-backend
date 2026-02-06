import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { sendOrderShippedWorkflow } from "../../../../../workflows/send-order-shipped";

/**
 * POST /admin/orders/:id/ship
 *
 * Mark order as shipped and send notification email.
 * Admin endpoint to update order status and notify customer.
 *
 * Body:
 * - tracking_number: string (optional)
 * - tracking_url: string (optional)
 * - carrier: string (optional)
 */
export async function POST(
  req: MedusaRequest<{
    tracking_number?: string;
    tracking_url?: string;
    carrier?: string;
  }>,
  res: MedusaResponse,
) {
  const { id } = req.params;
  const { tracking_number, tracking_url, carrier } = req.body;

  try {
    // Execute the order shipped workflow
    const { result } = await sendOrderShippedWorkflow(req.scope).run({
      input: {
        order_id: id,
        tracking_number,
        tracking_url,
        carrier,
      },
    });

    res.json({
      success: true,
      message: "Order marked as shipped and notification sent",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send shipment notification",
      error: error.message,
    });
  }
}
