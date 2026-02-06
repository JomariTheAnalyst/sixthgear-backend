import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import Stripe from "stripe";

/**
 * SIMPLIFIED Stripe Webhook Handler
 *
 * This version responds immediately to avoid timeouts
 * Order creation happens asynchronously
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  console.log("[Stripe Webhook] ===== WEBHOOK RECEIVED =====");

  const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
    apiVersion: "2025-02-24.acacia" as any,
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    console.error("[Stripe Webhook] No signature provided");
    res.status(400).json({ error: "No signature provided" });
    return;
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature as string,
      webhookSecret,
    );

    console.log(`[Stripe Webhook] ✅ Verified event: ${event.type}`);
  } catch (err: any) {
    console.error(
      "[Stripe Webhook] Signature verification failed:",
      err.message,
    );
    res
      .status(400)
      .json({ error: `Webhook signature verification failed: ${err.message}` });
    return;
  }

  // RESPOND IMMEDIATELY to avoid timeout
  res.status(200).json({ received: true });
  console.log("[Stripe Webhook] Response sent to Stripe");

  // Process event asynchronously
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(
          `[Stripe Webhook] 💰 Payment succeeded: ${paymentIntent.id}`,
        );
        console.log(
          `[Stripe Webhook] Amount: ${paymentIntent.amount} ${paymentIntent.currency}`,
        );
        console.log(`[Stripe Webhook] Metadata:`, paymentIntent.metadata);

        const cartId = paymentIntent.metadata?.cart_id;

        if (!cartId) {
          console.error("[Stripe Webhook] ⚠️ No cart_id in payment metadata");
          console.error(
            `[Stripe Webhook] Payment ID: ${paymentIntent.id} - Manual order creation needed`,
          );
          break;
        }

        console.log(`[Stripe Webhook] 🛒 Cart ID: ${cartId}`);
        console.log(`[Stripe Webhook] Attempting to create order...`);

        // Try to complete the cart
        try {
          const completeResponse = await fetch(
            `http://localhost:9000/store/carts/${cartId}/complete`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (completeResponse.ok) {
            const result = await completeResponse.json();

            if (result.type === "order") {
              console.log(
                `[Stripe Webhook] ✅✅✅ ORDER CREATED: ${result.order.id}`,
              );
              console.log(
                `[Stripe Webhook] Order total: ${result.order.total} ${result.order.currency_code}`,
              );
              console.log(`[Stripe Webhook] Customer: ${result.order.email}`);
            } else {
              console.error(
                "[Stripe Webhook] ❌ Cart completion did not return an order",
              );
            }
          } else {
            const errorText = await completeResponse.text();
            console.error(
              `[Stripe Webhook] ❌ Failed to complete cart: ${completeResponse.status}`,
            );
            console.error(`[Stripe Webhook] Error: ${errorText}`);
          }
        } catch (orderError: any) {
          console.error(
            "[Stripe Webhook] ❌ Order creation error:",
            orderError.message,
          );
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

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(`[Stripe Webhook] 💸 Charge refunded: ${charge.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Error processing event:", err);
  }

  console.log("[Stripe Webhook] ===== WEBHOOK PROCESSING COMPLETE =====");
}

async function getRawBody(req: MedusaRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      resolve(data);
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}
