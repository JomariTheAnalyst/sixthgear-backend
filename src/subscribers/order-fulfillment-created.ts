import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { sendOrderShippedWorkflow } from "../workflows/send-order-shipped";

/**
 * Order Fulfillment Created Subscriber
 *
 * Listens to the "order.fulfillment_created" event and sends an order shipped email.
 * This event is triggered when a fulfillment is created for an order.
 *
 * Event Data:
 * - id: Fulfillment ID
 * - order_id: Order ID
 * - metadata: Can contain tracking_number, tracking_url, carrier
 *
 * Workflow:
 * - Fetches order details
 * - Sends order shipped email via Resend with tracking info
 */
export default async function orderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string;
  order_id: string;
  metadata?: {
    tracking_number?: string;
    tracking_url?: string;
    carrier?: string;
  };
}>) {
  // Execute the order shipped workflow
  await sendOrderShippedWorkflow(container).run({
    input: {
      order_id: data.order_id,
      tracking_number: data.metadata?.tracking_number,
      tracking_url: data.metadata?.tracking_url,
      carrier: data.metadata?.carrier,
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
};
