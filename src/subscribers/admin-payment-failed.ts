import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Admin Payment Failed Notification Subscriber
 *
 * Sends a notification to the admin panel when a payment fails.
 * This is critical for tracking payment issues and following up with customers.
 *
 * Event: payment.payment_failed
 * Channel: feed (admin panel)
 * Provider: local
 *
 * Notification Details:
 * - Shows payment amount and customer
 * - Links to payment/order details
 * - High priority notification
 */
export default async function adminPaymentFailedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  // Fetch payment details
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: payments } = await query.graph({
    entity: "payment",
    fields: ["id", "amount", "currency_code", "order_id"],
    filters: { id: data.id },
  });

  const payment = payments[0];
  if (!payment) {
    return;
  }

  // Format currency amount
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: payment.currency_code.toUpperCase(),
  }).format(payment.amount / 100);

  // Fetch order details if available
  let orderInfo = "";
  if (payment.order_id) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["display_id", "email"],
      filters: { id: payment.order_id },
    });

    if (orders[0]) {
      orderInfo = ` • Order #${orders[0].display_id} • ${orders[0].email}`;
    }
  }

  // Send notification to admin panel
  await notificationModuleService.createNotifications({
    to: "admin",
    channel: "feed",
    template: "payment-failed-admin",
    data: {
      title: "Payment Failed",
      description: `Amount: ${formattedAmount}${orderInfo}`,
      resource_id: payment.order_id || payment.id,
      resource_type: payment.order_id ? "order" : "payment",
    },
  });
}

export const config: SubscriberConfig = {
  event: "payment.payment_failed",
};
