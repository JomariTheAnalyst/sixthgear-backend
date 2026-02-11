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
    apiVersion: "2024-12-18.acacia",
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
      case "checkout.session.completed": {
        // This event fires when Stripe Checkout session completes successfully
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `[Stripe Webhook] 🎉 Checkout session completed: ${session.id}`,
        );
        console.log(
          `[Stripe Webhook] Payment status: ${session.payment_status}`,
        );
        console.log(`[Stripe Webhook] Metadata:`, session.metadata);

        const cartId = session.metadata?.cart_id;

        if (!cartId) {
          console.error("[Stripe Webhook] ⚠️ No cart_id in session metadata");
          console.error(
            `[Stripe Webhook] Session ID: ${session.id} - Manual order creation needed`,
          );
          break;
        }

        console.log(`[Stripe Webhook] 🛒 Cart ID: ${cartId}`);

        // Only proceed if payment was successful
        if (session.payment_status !== "paid") {
          console.log(
            `[Stripe Webhook] ⚠️ Payment not completed yet: ${session.payment_status}`,
          );
          break;
        }

        console.log(`[Stripe Webhook] Creating order from Stripe Checkout...`);

        // For Stripe Checkout, we need to manually create the order
        // because the cart doesn't have a payment session
        try {
          const { createOrderWorkflow } =
            await import("@medusajs/medusa/core-flows");
          const { Modules } = await import("@medusajs/framework/utils");

          const query = req.scope.resolve("query");

          // Fetch cart with all necessary data
          const { data: carts } = await query.graph({
            entity: "cart",
            fields: [
              "id",
              "email",
              "region_id",
              "customer_id",
              "sales_channel_id",
              "currency_code",
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
            items: cart.items?.map((item: any) => ({
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
          };

          console.log(`[Stripe Webhook] Creating order with data:`, {
            email: orderData.email,
            items_count: orderData.items?.length,
            has_shipping: !!orderData.shipping_address,
          });

          // Create order using workflow
          const { result: order } = await createOrderWorkflow(req.scope).run({
            input: orderData,
          });

          console.log(`[Stripe Webhook] ✅✅✅ ORDER CREATED: ${order.id}`);
          console.log(`[Stripe Webhook] Order display_id: ${order.display_id}`);
          console.log(`[Stripe Webhook] Customer: ${order.email}`);

          // Link payment collection to order if it exists
          if (cart.payment_collection?.id) {
            try {
              const remoteLink = req.scope.resolve("remoteLink");

              await remoteLink.create({
                [Modules.ORDER]: {
                  order_id: order.id,
                },
                [Modules.PAYMENT]: {
                  payment_collection_id: cart.payment_collection.id,
                },
              });

              console.log(
                `[Stripe Webhook] ✅ Linked payment collection to order`,
              );
            } catch (linkError: any) {
              console.error(
                `[Stripe Webhook] ⚠️ Failed to link payment collection:`,
                linkError.message,
              );
              // Don't fail the order creation if linking fails
            }
          }

          // Delete the cart after successful order creation
          try {
            const cartModuleService = req.scope.resolve(Modules.CART);
            await cartModuleService.deleteCart(cartId);
            console.log(`[Stripe Webhook] ✅ Cart deleted: ${cartId}`);
          } catch (deleteError: any) {
            console.error(
              `[Stripe Webhook] ⚠️ Failed to delete cart:`,
              deleteError.message,
            );
            // Don't fail if cart deletion fails
          }
        } catch (workflowError: any) {
          console.error(
            "[Stripe Webhook] ❌ Workflow error:",
            workflowError.message,
          );
          console.error("[Stripe Webhook] Stack:", workflowError.stack);
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
        console.log(`[Stripe Webhook] Metadata:`, paymentIntent.metadata);
        console.log(
          `[Stripe Webhook] Note: Order should be created by checkout.session.completed event`,
        );
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
