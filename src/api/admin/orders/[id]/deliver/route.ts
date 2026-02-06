import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { sendOrderDeliveredWorkflow } from "../../../../../workflows/send-order-delivered";

/**
 * POST /admin/orders/:id/deliver
 *
 * Mark order as delivered and send notification email.
 * Admin endpoint to update order status and notify customer.
 *
 * Body:
 * - delivered_date: Date (optional, defaults to now)
 */
export async function POST(
  req: MedusaRequest<{
    delivered_date?: Date;
  }>,
  res: MedusaResponse,
) {
  const { id } = req.params;
  const { delivered_date } = req.body;

  try {
    // Execute the order delivered workflow
    const { result } = await sendOrderDeliveredWorkflow(req.scope).run({
      input: {
        order_id: id,
        delivered_date: delivered_date || new Date(),
      },
    });

    res.json({
      success: true,
      message: "Order marked as delivered and notification sent",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send delivery notification",
      error: error.message,
    });
  }
}
