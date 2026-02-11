import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /store/orders/:id
 *
 * Fetch order details including custom_display_id
 * Used by order confirmation page to display custom order number
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const orderId = req.params.id;

  if (!orderId) {
    res.status(400).json({
      message: "Order ID is required",
    });
    return;
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "custom_display_id",
        "email",
        "total",
        "currency_code",
        "created_at",
        "status",
        "payment_status",
        "fulfillment_status",
      ],
      filters: { id: orderId },
    });

    const order = orders[0];

    if (!order) {
      res.status(404).json({
        message: "Order not found",
      });
      return;
    }

    res.json({ order });
  } catch (error: any) {
    console.error("[Store API] Error fetching order:", error);
    res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
}
