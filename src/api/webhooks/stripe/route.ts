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
  apiVersion: "2024-12-18.acacia",
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
          console.log(
            `[Stripe Webhook] Publishable key available: ${!!process.env.MEDUSA_PUBLISHABLE_KEY}`,
          );

          try {
            // Complete cart to create order
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

              // If payment collection not initiated, this is expected with Stripe Checkout
              if (
                errorData.message?.includes(
                  "Payment collection has not been initiated",
                )
              ) {
                console.log(
                  "[Stripe Webhook] ℹ️ Cart uses Stripe Checkout (no Medusa payment session)",
                );
                console.log(
                  "[Stripe Webhook] ✅ Payment confirmed by Stripe, customer already notified",
                );
                console.log(
                  "[Stripe Webhook] 💡 Order can be created manually in admin if needed",
                );
              } else {
                console.error(
                  "[Stripe Webhook] ❌ Cart completion failed:",
                  errorData,
                );
              }
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
