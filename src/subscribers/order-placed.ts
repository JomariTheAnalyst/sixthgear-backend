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
  // Execute the order confirmation workflow
  await sendOrderConfirmationWorkflow(container).run({
    input: {
      id: data.id,
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
