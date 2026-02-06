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
            // For Stripe Checkout, we need to use Medusa SDK directly
            // because the cart doesn't have a payment session (Stripe handles payment)
            const query = req.scope.resolve("query");

            // First, check if order already exists for this cart
            const { data: existingOrders } = await query.graph({
              entity: "order",
              fields: ["id", "cart_id"],
              filters: { cart_id: cartId },
            });

            if (existingOrders && existingOrders.length > 0) {
              console.log(
                `[Stripe Webhook] ℹ️ Order already exists: ${existingOrders[0].id}`,
              );
              console.log(
                `[Stripe Webhook] ✅ Skipping duplicate order creation`,
              );
              break;
            }

            // Get cart details
            const { data: carts } = await query.graph({
              entity: "cart",
              fields: [
                "id",
                "email",
                "total",
                "subtotal",
                "discount_total",
                "tax_total",
                "region_id",
                "customer_id",
                "sales_channel_id",
                "items.*",
                "items.variant_id",
                "items.product_id",
                "items.quantity",
                "items.unit_price",
                "items.total",
                "shipping_address.*",
                "billing_address.*",
                "shipping_methods.*",
                "shipping_methods.shipping_option_id",
                "shipping_methods.amount",
              ],
              filters: { id: cartId },
            });

            const cart = carts?.[0];

            if (!cart) {
              console.error(`[Stripe Webhook] ❌ Cart not found: ${cartId}`);
              break;
            }

            console.log(`[Stripe Webhook] Cart found:`, {
              id: cart.id,
              email: cart.email,
              total: cart.total,
              items_count: cart.items?.length,
            });

            // Use Medusa SDK to create order directly
            const orderModuleService = req.scope.resolve("orderModuleService");

            // Prepare order data
            const orderData = {
              region_id: cart.region_id,
              customer_id: cart.customer_id,
              sales_channel_id: cart.sales_channel_id,
              email: cart.email,
              currency_code: "php", // From cart region
              shipping_address: cart.shipping_address
                ? {
                    first_name: cart.shipping_address.first_name,
                    last_name: cart.shipping_address.last_name,
                    address_1: cart.shipping_address.address_1,
                    address_2: cart.shipping_address.address_2,
                    city: cart.shipping_address.city,
                    province: cart.shipping_address.province,
                    postal_code: cart.shipping_address.postal_code,
                    country_code: cart.shipping_address.country_code,
                    phone: cart.shipping_address.phone,
                  }
                : undefined,
              billing_address: cart.billing_address
                ? {
                    first_name: cart.billing_address.first_name,
                    last_name: cart.billing_address.last_name,
                    address_1: cart.billing_address.address_1,
                    address_2: cart.billing_address.address_2,
                    city: cart.billing_address.city,
                    province: cart.billing_address.province,
                    postal_code: cart.billing_address.postal_code,
                    country_code: cart.billing_address.country_code,
                    phone: cart.billing_address.phone,
                  }
                : cart.shipping_address
                  ? {
                      first_name: cart.shipping_address.first_name,
                      last_name: cart.shipping_address.last_name,
                      address_1: cart.shipping_address.address_1,
                      address_2: cart.shipping_address.address_2,
                      city: cart.shipping_address.city,
                      province: cart.shipping_address.province,
                      postal_code: cart.shipping_address.postal_code,
                      country_code: cart.shipping_address.country_code,
                      phone: cart.shipping_address.phone,
                    }
                  : undefined,
              items: cart.items?.map((item: any) => ({
                variant_id: item.variant_id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: item.total,
                title: item.title,
              })),
              shipping_methods: cart.shipping_methods?.map((sm: any) => ({
                shipping_option_id: sm.shipping_option_id,
                amount: sm.amount,
                name: sm.name,
              })),
              metadata: {
                cart_id: cartId,
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent,
              },
            };

            console.log(
              `[Stripe Webhook] Creating order with data:`,
              JSON.stringify(orderData, null, 2),
            );

            const order = await orderModuleService.createOrders(orderData);

            console.log(`[Stripe Webhook] ✅✅✅ ORDER CREATED: ${order.id}`);
            console.log(`[Stripe Webhook] Order total: ${order.total}`);
            console.log(`[Stripe Webhook] Customer: ${order.email}`);
          } catch (orderError: any) {
            console.error(
              "[Stripe Webhook] ❌ Order creation error:",
              orderError.message,
            );
            console.error("[Stripe Webhook] Stack:", orderError.stack);

            // Fallback: Try the standard cart completion endpoint
            console.log(
              "[Stripe Webhook] Attempting fallback: standard cart completion",
            );

            try {
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

              if (completeResponse.ok) {
                const result = await completeResponse.json();
                if (result && result.type === "order") {
                  console.log(
                    `[Stripe Webhook] ✅ Fallback successful - ORDER CREATED: ${result.order.id}`,
                  );
                }
              } else {
                const errorData = await completeResponse.json();
                console.error(
                  "[Stripe Webhook] ❌ Fallback also failed:",
                  errorData,
                );
              }
            } catch (fallbackError: any) {
              console.error(
                "[Stripe Webhook] ❌ Fallback error:",
                fallbackError.message,
              );
            }
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
