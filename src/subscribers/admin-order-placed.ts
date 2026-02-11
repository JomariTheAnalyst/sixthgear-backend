import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Admin Order Placed Notification Subscriber
 *
 * Sends a notification to the admin panel when a new order is placed.
 * This runs alongside the customer email notification.
 *
 * Event: order.placed
 * Channel: feed (admin panel)
 * Provider: local
 *
 * Notification Details:
 * - Shows order ID and total amount
 * - Links to order details page
 * - High priority notification
 */
export default async function adminOrderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("🔔 [Admin Notification] Order placed event received:", data.id);

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  // Fetch order details to include in notification
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "custom_display_id",
      "total",
      "currency_code",
      "email",
      "payment_collections.*",
      "payment_collections.payments.*",
    ],
    filters: { id: data.id },
  });

  const order = orders[0];
  if (!order) {
    console.error("❌ [Admin Notification] Order not found:", data.id);
    return;
  }

  console.log("📦 [Admin Notification] Order details:", {
    id: order.id,
    display_id: order.display_id,
    custom_display_id: order.custom_display_id,
    total: order.total,
    total_type: typeof order.total,
    currency_code: order.currency_code,
    email: order.email,
  });

  // Detect payment method
  const paymentCollection = (order as any).payment_collections?.[0];
  const payment = paymentCollection?.payments?.[0];
  const paymentProvider = payment?.provider_id || "unknown";

  let paymentMethod = "Unknown";
  if (
    paymentProvider?.includes("stripe") ||
    paymentProvider === "pp_stripe_stripe"
  ) {
    paymentMethod = "Stripe";
  } else if (paymentProvider === "pp_system_default") {
    paymentMethod = "Cash on Delivery";
  } else if (paymentProvider === "manual" || paymentProvider === "cod") {
    paymentMethod = "Cash on Delivery";
  }

  console.log("💳 [Admin Notification] Payment info:", {
    provider_id: paymentProvider,
    payment_method: paymentMethod,
  });

  // IMPORTANT: Check if order.total is already in pesos or in centavos
  // If total is 179, it's already in pesos (wrong)
  // If total is 17900, it's in centavos (correct)
  const totalInPesos = order.total < 1000 ? order.total : order.total / 100;

  const formattedTotal = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: order.currency_code.toUpperCase(),
  }).format(totalInPesos);

  console.log("💰 [Admin Notification] Price calculation:", {
    raw_total: order.total,
    total_in_pesos: totalInPesos,
    formatted: formattedTotal,
  });

  // Generate custom order number from display_id if custom_display_id not set yet
  // This handles the race condition where this subscriber runs before set-custom-order-number
  const orderNumber =
    order.custom_display_id ||
    `SIX-${String(order.display_id).padStart(6, "0")}`;

  // Send notification to admin panel
  // According to Medusa docs, for clickable notifications we need:
  // - to: recipient
  // - channel: "feed" for admin panel
  // - template: template name
  // - data: notification content (title, description, etc.)
  try {
    await notificationModuleService.createNotifications({
      to: "admin",
      channel: "feed",
      template: "order-placed-admin",
      data: {
        title: `New Order ${orderNumber}`,
        description: `${formattedTotal} • ${paymentMethod} • ${order.email}`,
        // For clickable notifications, include resource info
        resource_id: order.id,
        resource_type: "order",
        // Additional metadata for admin UI
        order_id: order.id,
        order_display_id: order.display_id,
      },
    });
    console.log("✅ [Admin Notification] Notification sent successfully");
  } catch (error) {
    console.error(
      "❌ [Admin Notification] Failed to send notification:",
      error,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
