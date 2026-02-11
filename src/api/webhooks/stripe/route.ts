// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import Stripe from "stripe";

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events and creates orders when payments succeed
 * Supports both Stripe Checkout and Payment Intents
 *
 * Events handled:
 * - checkout.session.completed (Stripe Checkout)
 * - payment_intent.succeeded (Payment Intents)
 */

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  console.log("[Stripe Webhook] ===== WEBHOOK RECEIVED =====");

  let event: Stripe.Event;

  try {
    // In development, skip signature verification for simplicity
    // In production, you should verify signatures properly
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Stripe Webhook] ⚠️ Development mode - skipping signature verification",
      );
      event = req.body as Stripe.Event;
    } else {
      // Get raw body for signature verification
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const signature =
        req.headers["stripe-signature"] ||
        req.headers.get?.("stripe-signature");

      if (!signature) {
        console.error("[Stripe Webhook] ❌ No signature header found");
        res.status(400).json({ error: "No signature header" });
        return;
      }

      // Verify webhook signature
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!,
        );
        console.log(`[Stripe Webhook] ✅ Signature verified: ${event.type}`);
      } catch (err: any) {
        console.error(
          "[Stripe Webhook] ❌ Signature verification failed:",
          err.message,
        );
        res.status(400).json({ error: `Webhook Error: ${err.message}` });
        return;
      }
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Failed to process webhook:", err.message);
    res.status(400).json({ error: "Invalid webhook data" });
    return;
  }

  // RESPOND IMMEDIATELY to prevent timeout
  res.status(200).json({ received: true });
  console.log("[Stripe Webhook] Response sent to Stripe");

  // Process event asynchronously
  setImmediate(async () => {
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(
            `[Stripe Webhook] 🛒 Checkout session completed: ${session.id}`,
          );
          console.log(
            `[Stripe Webhook] Payment status: ${session.payment_status}`,
          );

          if (session.payment_status !== "paid") {
            console.log(
              `[Stripe Webhook] ⚠️ Payment not completed yet, skipping order creation`,
            );
            break;
          }

          const cartId = session.metadata?.cart_id;

          if (!cartId) {
            console.error("[Stripe Webhook] ⚠️ No cart_id in session metadata");
            console.error(`[Stripe Webhook] Session ID: ${session.id}`);
            break;
          }

          console.log(`[Stripe Webhook] 🛒 Cart ID: ${cartId}`);
          console.log(`[Stripe Webhook] Creating order...`);

          try {
            // For Stripe Checkout, use createOrderWorkflow to manually create order
            // because the cart doesn't have a payment session (Stripe handles payment)
            const { createOrderWorkflow } =
              await import("@medusajs/medusa/core-flows");
            const { Modules } = await import("@medusajs/framework/utils");

            const query = req.scope.resolve("query");

            // Get cart details with all necessary data
            const { data: carts } = await query.graph({
              entity: "cart",
              fields: [
                "id",
                "email",
                "currency_code",
                "region_id",
                "customer_id",
                "sales_channel_id",
                "shipping_address.*",
                "billing_address.*",
                "items.*",
                "items.variant_id",
                "items.product_id",
                "items.quantity",
                "items.unit_price",
                "items.title",
                "items.subtitle",
                "items.thumbnail",
                "items.metadata",
                "shipping_methods.*",
                "shipping_methods.name",
                "shipping_methods.amount",
                "shipping_methods.is_tax_inclusive",
                "shipping_methods.shipping_option_id",
                "shipping_methods.data",
                "shipping_methods.tax_lines.*",
                "shipping_methods.adjustments.*",
                "payment_collection.*",
                "payment_collection.id",
              ],
              filters: { id: cartId },
            });

            const cart = carts?.[0];

            if (!cart) {
              console.error(`[Stripe Webhook] ❌ Cart not found: ${cartId}`);
              break;
            }

            console.log(`[Stripe Webhook] Cart data:`, {
              id: cart.id,
              email: cart.email,
              items_count: cart.items?.length,
              has_shipping_address: !!cart.shipping_address,
              has_billing_address: !!cart.billing_address,
              payment_collection_id: cart.payment_collection?.id,
            });

            // Filter items if selected_item_ids in session metadata
            let itemsToOrder = cart.items || [];
            const selectedItemIds = session.metadata?.selected_item_ids;
            if (selectedItemIds) {
              const selectedIds = selectedItemIds.split(",").filter(Boolean);
              itemsToOrder = cart.items?.filter((item: any) =>
                selectedIds.includes(item.id),
              );

              console.log(`[Stripe Webhook] Filtering items:`, {
                total_items: cart.items?.length,
                selected_items: itemsToOrder.length,
                selected_ids: selectedIds,
              });

              if (itemsToOrder.length === 0) {
                console.error(
                  `[Stripe Webhook] ❌ No selected items found in cart`,
                );
                break;
              }
            } else {
              console.log(
                `[Stripe Webhook] No item selection - using all cart items`,
              );
            }

            // Prepare order data from cart
            const orderData = {
              region_id: cart.region_id,
              customer_id: cart.customer_id,
              sales_channel_id: cart.sales_channel_id,
              email: cart.email,
              currency_code: cart.currency_code,
              shipping_address: cart.shipping_address
                ? {
                    ...cart.shipping_address,
                    id: undefined, // Remove ID to create new address
                  }
                : undefined,
              billing_address: cart.billing_address
                ? {
                    ...cart.billing_address,
                    id: undefined, // Remove ID to create new address
                  }
                : undefined,
              items: itemsToOrder.map((item: any) => ({
                variant_id: item.variant_id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                title: item.title,
                subtitle: item.subtitle,
                thumbnail: item.thumbnail,
                metadata: item.metadata,
              })),
              shipping_methods: cart.shipping_methods?.map((method: any) => ({
                name: method.name,
                amount: method.amount,
                is_tax_inclusive: method.is_tax_inclusive,
                shipping_option_id: method.shipping_option_id,
                data: method.data,
                tax_lines: method.tax_lines?.map((taxLine: any) => ({
                  description: taxLine.description,
                  tax_rate_id: taxLine.tax_rate_id,
                  code: taxLine.code,
                  rate: taxLine.rate,
                  provider_id: taxLine.provider_id,
                })),
                adjustments: method.adjustments?.map((adjustment: any) => ({
                  code: adjustment.code,
                  amount: adjustment.amount,
                  description: adjustment.description,
                  promotion_id: adjustment.promotion_id,
                  provider_id: adjustment.provider_id,
                })),
              })),
              metadata: {
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent,
                payment_provider: "pp_stripe_stripe", // Explicitly set Stripe provider
              },
            };

            console.log(`[Stripe Webhook] Creating order with workflow...`);

            // Create order using workflow
            const { result: order } = await createOrderWorkflow(req.scope).run({
              input: orderData,
            });

            console.log(`[Stripe Webhook] ✅✅✅ ORDER CREATED: ${order.id}`);
            console.log(
              `[Stripe Webhook] Order display_id: ${order.display_id}`,
            );
            console.log(`[Stripe Webhook] Customer: ${order.email}`);

            // Step 1: Create payment collection and authorize payment
            // Stripe Checkout already processed payment, we record it as authorized in Medusa
            try {
              console.log(`[Stripe Webhook] Recording Stripe payment...`);

              const paymentModuleService = req.scope.resolve(Modules.PAYMENT);
              const remoteLink = req.scope.resolve("remoteLink");

              // Get payment amount from Stripe session (in cents)
              // Stripe stores in cents, convert to actual amount for Medusa
              const paymentAmountInCents = session.amount_total;
              const paymentAmount = paymentAmountInCents / 100; // Convert cents to pesos

              // Use order total instead of Stripe amount (in case of selected items)
              const orderTotal = order.total || paymentAmount;

              console.log(`[Stripe Webhook] Payment amount:`, {
                stripe_amount_cents: paymentAmountInCents,
                stripe_amount: paymentAmount,
                order_total: orderTotal,
                using: orderTotal,
              });

              if (!orderTotal || orderTotal <= 0) {
                throw new Error(`Invalid order total: ${orderTotal}`);
              }

              // Create payment collection with order total (not Stripe amount)
              const paymentCollection =
                await paymentModuleService.createPaymentCollections({
                  region_id: cart.region_id,
                  currency_code: cart.currency_code,
                  amount: orderTotal, // Use order total
                });

              console.log(
                `[Stripe Webhook] ✅ Payment collection created: ${paymentCollection.id} with amount ₱${orderTotal}`,
              );

              // Link payment collection to order
              await remoteLink.create({
                [Modules.ORDER]: {
                  order_id: order.id,
                },
                [Modules.PAYMENT]: {
                  payment_collection_id: paymentCollection.id,
                },
              });

              console.log(`[Stripe Webhook] ✅ Linked to order`);

              // Step 2: Create payment session and payment for Stripe
              // This will show the correct provider and payment status
              const paymentSession =
                await paymentModuleService.createPaymentSession(
                  paymentCollection.id,
                  {
                    provider_id: "pp_stripe_stripe", // Stripe provider
                    currency_code: cart.currency_code,
                    amount: orderTotal, // Use order total
                    data: {
                      // Stripe provider expects 'id' field for payment intent
                      id: session.payment_intent,
                    },
                  },
                );

              console.log(
                `[Stripe Webhook] ✅ Payment session created: ${paymentSession.id}`,
              );
              console.log(
                `[Stripe Webhook]    - provider_id: pp_stripe_stripe`,
              );

              // Step 3: Authorize the payment
              // Since Stripe already processed the payment, we just need to record it as authorized
              console.log(
                `[Stripe Webhook] Authorizing payment for Stripe session...`,
              );

              try {
                // Try to authorize the payment session
                const authorizedPayment =
                  await paymentModuleService.authorizePaymentSession(
                    paymentSession.id,
                    {
                      context: {
                        id: session.payment_intent,
                      },
                    },
                  );

                console.log(
                  `[Stripe Webhook] ✅ Payment authorized: ${authorizedPayment.id}`,
                );
                console.log(`[Stripe Webhook] ✅ Provider: pp_stripe_stripe`);
                console.log(
                  `[Stripe Webhook] ✅ Status: Authorized (will show in admin)`,
                );
              } catch (authError: any) {
                // If authorization fails, create payment manually and mark as authorized
                console.log(
                  `[Stripe Webhook] Authorization API failed, recording payment manually...`,
                );
                console.log(`[Stripe Webhook] Error: ${authError.message}`);

                // Create payment record manually
                const payment = await paymentModuleService.createPayments({
                  amount: orderTotal, // Use order total
                  currency_code: cart.currency_code,
                  provider_id: "pp_stripe_stripe",
                  payment_collection_id: paymentCollection.id,
                  payment_session_id: paymentSession.id, // ← REQUIRED FIELD
                  data: {
                    // Stripe provider expects 'id' field for payment intent
                    id: session.payment_intent,
                  },
                });

                console.log(
                  `[Stripe Webhook] ✅ Payment record created: ${payment.id}`,
                );

                // Update payment collection to mark as authorized
                await paymentModuleService.updatePaymentCollections(
                  paymentCollection.id,
                  {
                    authorized_amount: orderTotal, // Use order total
                    status: "authorized",
                  },
                );

                console.log(`[Stripe Webhook] ✅ Payment collection updated:`);
                console.log(
                  `[Stripe Webhook]    - authorized_amount: ₱${orderTotal}`,
                );
                console.log(`[Stripe Webhook]    - status: authorized`);
                console.log(
                  `[Stripe Webhook] ✅ Admin will show: Provider=pp_stripe_stripe, Status=Authorized`,
                );
              }

              // Step 5: Create inventory reservations for order items
              // Since we're using createOrderWorkflow directly, we need to manually reserve inventory
              try {
                console.log(
                  `[Stripe Webhook] Creating inventory reservations...`,
                );

                const inventoryModuleService = req.scope.resolve(
                  Modules.INVENTORY,
                );

                // Get order items with variant information
                const { data: orders } = await query.graph({
                  entity: "order",
                  fields: [
                    "id",
                    "items.*",
                    "items.variant_id",
                    "items.quantity",
                    "items.variant.*",
                    "items.variant.manage_inventory",
                    "items.variant.inventory_items.*",
                    "items.variant.inventory_items.inventory_item_id",
                    "sales_channel_id",
                  ],
                  filters: { id: order.id },
                });

                const orderWithItems = orders?.[0];

                if (orderWithItems?.items) {
                  for (const item of orderWithItems.items) {
                    // Only create reservation if variant has manage_inventory enabled
                    if (
                      item.variant?.manage_inventory &&
                      item.variant?.inventory_items?.length > 0
                    ) {
                      const inventoryItem = item.variant.inventory_items[0];

                      // Get stock location from sales channel
                      // For now, use the first available location
                      const locations =
                        await inventoryModuleService.listInventoryLevels({
                          inventory_item_id: inventoryItem.inventory_item_id,
                        });

                      if (locations.length > 0) {
                        const location = locations[0];

                        await inventoryModuleService.createReservationItems([
                          {
                            inventory_item_id: inventoryItem.inventory_item_id,
                            location_id: location.location_id,
                            quantity: item.quantity,
                            line_item_id: item.id,
                            metadata: {
                              order_id: order.id,
                              created_by: "stripe_webhook",
                            },
                          },
                        ]);

                        console.log(
                          `[Stripe Webhook] ✅ Reserved ${item.quantity}x of item ${item.id} at location ${location.location_id}`,
                        );
                      } else {
                        console.warn(
                          `[Stripe Webhook] ⚠️ No stock location found for inventory item ${inventoryItem.inventory_item_id}`,
                        );
                      }
                    }
                  }

                  console.log(
                    `[Stripe Webhook] ✅ Inventory reservations created`,
                  );
                }
              } catch (inventoryError: any) {
                console.error(
                  `[Stripe Webhook] ⚠️ Inventory reservation error:`,
                  inventoryError.message,
                );
                // Continue - inventory can be manually allocated in admin
              }

              // Step 6: Emit order.placed event for notifications and emails
              try {
                console.log(`[Stripe Webhook] Emitting order.placed event...`);

                const eventBusModuleService = req.scope.resolve(
                  Modules.EVENT_BUS,
                );

                await eventBusModuleService.emit({
                  name: "order.placed",
                  data: { id: order.id },
                });

                console.log(
                  `[Stripe Webhook] ✅ order.placed event emitted - notifications and emails will be sent`,
                );
              } catch (eventError: any) {
                console.error(
                  `[Stripe Webhook] ⚠️ Failed to emit order.placed event:`,
                  eventError.message,
                );
                // Continue - order is created
              }
            } catch (paymentError: any) {
              console.error(
                `[Stripe Webhook] ⚠️ Payment error:`,
                paymentError.message,
              );
              console.error(`[Stripe Webhook] Stack:`, paymentError.stack);
              // Continue - order is created, payment can be manually captured
            }

            // Delete the cart after successful order creation
            try {
              const cartModuleService = req.scope.resolve(Modules.CART);
              await cartModuleService.deleteCarts(cartId);
              console.log(`[Stripe Webhook] ✅ Cart deleted: ${cartId}`);

              // If this was a checkout cart (has original_cart_id in metadata),
              // clean up the original cart by removing ordered items
              if (cart.metadata?.original_cart_id) {
                const originalCartId = cart.metadata.original_cart_id;
                const selectedItemIds = cart.metadata.selected_item_ids || [];

                console.log(
                  `[Stripe Webhook] Checkout cart detected, cleaning up original cart: ${originalCartId}`,
                );

                try {
                  // Get original cart
                  const { data: originalCarts } = await query.graph({
                    entity: "cart",
                    fields: ["id", "items.*", "items.id"],
                    filters: { id: originalCartId },
                  });

                  const originalCart = originalCarts?.[0];

                  if (originalCart) {
                    // Remove ordered items from original cart
                    for (const itemId of selectedItemIds) {
                      const itemExists = originalCart.items?.some(
                        (item: any) => item.id === itemId,
                      );

                      if (itemExists) {
                        await cartModuleService.removeLineItems(
                          originalCartId,
                          [itemId],
                        );
                        console.log(
                          `[Stripe Webhook] ✅ Removed item ${itemId} from original cart`,
                        );
                      }
                    }

                    console.log(
                      `[Stripe Webhook] ✅ Original cart cleaned up, unordered items remain`,
                    );
                  }
                } catch (cleanupError: any) {
                  console.warn(
                    `[Stripe Webhook] ⚠️ Failed to clean up original cart:`,
                    cleanupError.message,
                  );
                  // Continue - order is created successfully
                }
              }
            } catch (deleteError: any) {
              console.error(
                `[Stripe Webhook] ⚠️ Failed to delete cart:`,
                deleteError.message,
              );
              // Don't fail if cart deletion fails
            }
          } catch (orderError: any) {
            console.error(
              "[Stripe Webhook] ❌ Order creation error:",
              orderError.message,
            );
            console.error("[Stripe Webhook] Stack:", orderError.stack);
          }

          break;
        }

        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(
            `[Stripe Webhook] 💰 Payment succeeded: ${paymentIntent.id}`,
          );
          console.log(
            `[Stripe Webhook] Amount: ${paymentIntent.amount} ${paymentIntent.currency}`,
          );

          const cartId = paymentIntent.metadata?.cart_id;

          if (!cartId) {
            console.error("[Stripe Webhook] ⚠️ No cart_id in payment metadata");
            console.error(`[Stripe Webhook] Payment ID: ${paymentIntent.id}`);
            break;
          }

          console.log(`[Stripe Webhook] 🛒 Cart ID: ${cartId}`);
          console.log(`[Stripe Webhook] Creating order...`);

          try {
            // Complete cart to create order using Store API
            const completeResponse = await fetch(
              `${process.env.MEDUSA_BACKEND_URL}/store/carts/${cartId}/complete`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-publishable-api-key":
                    process.env.MEDUSA_PUBLISHABLE_KEY || "",
                },
              },
            );

            if (!completeResponse.ok) {
              const errorData = await completeResponse.json();
              console.error(
                "[Stripe Webhook] ❌ Cart completion failed:",
                errorData,
              );
              break;
            }

            const result = await completeResponse.json();

            if (result && result.type === "order") {
              console.log(
                `[Stripe Webhook] ✅✅✅ ORDER CREATED: ${result.order.id}`,
              );
              console.log(
                `[Stripe Webhook] Order total: ${result.order.total}`,
              );
              console.log(`[Stripe Webhook] Customer: ${result.order.email}`);
            } else {
              console.error(
                "[Stripe Webhook] ❌ Cart completion did not return an order",
              );
              console.error("[Stripe Webhook] Result:", result);
            }
          } catch (orderError: any) {
            console.error(
              "[Stripe Webhook] ❌ Order creation error:",
              orderError.message,
            );
            console.error("[Stripe Webhook] Stack:", orderError.stack);
          }

          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error(
            `[Stripe Webhook] ❌ Payment failed: ${paymentIntent.id}`,
          );
          break;
        }

        default:
          console.log(`[Stripe Webhook] ℹ️ Event type: ${event.type}`);
      }
    } catch (err: any) {
      console.error("[Stripe Webhook] Error processing event:", err);
      console.error("[Stripe Webhook] Stack:", err.stack);
    }

    console.log("[Stripe Webhook] ===== WEBHOOK PROCESSING COMPLETE =====");
  });
}
