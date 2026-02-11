import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { generateOrderNumber } from "../utils/generate-order-number";

/**
 * Set Custom Order Number Subscriber
 *
 * Automatically generates and sets custom_display_id when an order is placed.
 * Format: SIX-000123
 *
 * Event: order.placed
 *
 * This subscriber:
 * 1. Listens for order.placed event
 * 2. Fetches the order to get display_id
 * 3. Generates custom order number (SIX-XXXXXX)
 * 4. Updates order.custom_display_id
 * 5. Skips if custom_display_id already exists (idempotent)
 */
export default async function setCustomOrderNumberHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("🔢 [Custom Order Number] Processing order:", data.id);

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Fetch order to get display_id and check if custom_display_id already set
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "custom_display_id"],
    filters: { id: data.id },
  });

  const order = orders[0];
  if (!order) {
    console.error("❌ [Custom Order Number] Order not found:", data.id);
    return;
  }

  // Skip if custom_display_id already set (idempotent)
  if (order.custom_display_id) {
    console.log(
      "✅ [Custom Order Number] Already set:",
      order.custom_display_id,
    );
    return;
  }

  // Generate custom order number from display_id
  const customOrderNumber = generateOrderNumber(order.display_id);

  console.log("🔢 [Custom Order Number] Generated:", {
    order_id: order.id,
    display_id: order.display_id,
    custom_display_id: customOrderNumber,
  });

  // Update order with custom order number
  try {
    const orderModuleService = container.resolve(Modules.ORDER);

    await orderModuleService.updateOrders({
      id: order.id,
      custom_display_id: customOrderNumber,
    });

    console.log(
      "✅ [Custom Order Number] Set successfully:",
      customOrderNumber,
    );
  } catch (error) {
    console.error("❌ [Custom Order Number] Failed to set:", error);
    throw error; // Re-throw to ensure event is retried
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
