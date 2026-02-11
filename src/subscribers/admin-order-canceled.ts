import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Admin Order Canceled Notification Subscriber
 *
 * Sends a notification to the admin panel when an order is canceled.
 * This helps admins track cancellations and potential issues.
 *
 * Event: order.canceled
 * Channel: feed (admin panel)
 * Provider: local
 *
 * Notification Details:
 * - Shows order ID and customer email
 * - Links to order details page
 * - Medium priority notification
 */
export default async function adminOrderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  // Fetch order details
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "total", "currency_code", "email"],
    filters: { id: data.id },
  });

  const order = orders[0];
  if (!order) {
    return;
  }

  // Format currency amount
  const formattedTotal = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: order.currency_code.toUpperCase(),
  }).format(order.total / 100);

  // Send notification to admin panel
  await notificationModuleService.createNotifications({
    to: "admin",
    channel: "feed",
    template: "order-canceled-admin",
    data: {
      title: `Order #${order.display_id} Canceled`,
      description: `Amount: ${formattedTotal} • Customer: ${order.email}`,
      resource_id: order.id,
      resource_type: "order",
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.canceled",
};
