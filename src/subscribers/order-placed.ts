import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation";

/**
 * Order Placed Subscriber
 *
 * Listens to the "order.placed" event and sends an order confirmation email.
 *
 * Event Data:
 * - id: Order ID
 *
 * Workflow:
 * - Fetches order details
 * - Sends order confirmation email via Resend
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔔 [Order Email] Order placed event received");
  console.log("📦 [Order Email] Order ID:", data.id);
  console.log("⏰ [Order Email] Timestamp:", new Date().toISOString());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    console.log(
      "🚀 [Order Email] Starting send-order-confirmation workflow...",
    );

    const result = await sendOrderConfirmationWorkflow(container).run({
      input: {
        id: data.id,
      },
    });

    console.log("✅ [Order Email] Workflow completed successfully");
    console.log("📧 [Order Email] Result:", JSON.stringify(result, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error: any) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ [Order Email] Workflow failed!");
    console.error("📦 [Order Email] Order ID:", data.id);
    console.error("🔥 [Order Email] Error:", error.message);
    console.error("📚 [Order Email] Stack:", error.stack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Re-throw to ensure Medusa knows the subscriber failed
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
