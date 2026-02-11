import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Admin Order Fulfillment Created Notification Subscriber
 *
 * Sends a notification to the admin panel when an order fulfillment is created.
 * This confirms that an order has been marked as shipped.
 *
 * Event: order.fulfillment_created
 * Channel: feed (admin panel)
 * Provider: local
 *
 * Notification Details:
 * - Shows order ID
 * - Shows tracking info if available
 * - Links to order details page
 * - Low priority notification (informational)
 */
export default async function adminOrderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string;
  order_id: string;
  metadata?: {
    tracking_number?: string;
    carrier?: string;
  };
}>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  // Fetch order details
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email"],
    filters: { id: data.order_id },
  });

  const order = orders[0];
  if (!order) {
    return;
  }

  // Build tracking info if available
  let trackingInfo = "";
  if (data.metadata?.tracking_number) {
    trackingInfo = ` • Tracking: ${data.metadata.tracking_number}`;
    if (data.metadata.carrier) {
      trackingInfo += ` (${data.metadata.carrier})`;
    }
  }

  // Send notification to admin panel
  await notificationModuleService.createNotifications({
    to: "admin",
    channel: "feed",
    template: "order-shipped-admin",
    data: {
      title: `Order #${order.display_id} Shipped`,
      description: `Customer: ${order.email}${trackingInfo}`,
      resource_id: order.id,
      resource_type: "order",
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
};
