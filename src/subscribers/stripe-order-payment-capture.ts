import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * Stripe Order Payment Capture Subscriber
 *
 * Automatically captures payment and allocates inventory for Stripe Checkout orders
 *
 * Event: order.placed
 *
 * This subscriber:
 * 1. Checks if order has Stripe metadata (from Stripe Checkout)
 * 2. Creates payment collection if it doesn't exist
 * 3. Creates and captures payment
 * 4. Reserves inventory for all items
 */
export default async function stripeOrderPaymentCaptureHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(
    "💳 [Stripe Payment Capture] DISABLED - Webhook handles everything",
  );
  console.log("💳 [Stripe Payment Capture] Order:", data.id);

  // DISABLED: This subscriber is redundant because the Stripe webhook already:
  // 1. Creates payment collection
  // 2. Creates payment session
  // 3. Authorizes payment
  // 4. Creates inventory reservations
  // 5. Links payment to order
  //
  // Running this subscriber causes:
  // - Duplicate payment collections
  // - Auto-capture of payments (should stay authorized for COD)
  // - Conflicts with webhook logic
  //
  // The webhook is the single source of truth for Stripe orders.

  return;
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
