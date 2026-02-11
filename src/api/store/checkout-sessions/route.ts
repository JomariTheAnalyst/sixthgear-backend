// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import Stripe from "stripe";

/**
 * Stripe Checkout Session Creation Endpoint
 *
 * Creates a Stripe Checkout Session (hosted payment page) for a cart
 * Following official Stripe Checkout documentation
 *
 * @see https://stripe.com/docs/payments/checkout/how-checkout-works
 * @see https://stripe.com/docs/api/checkout/sessions/create
 */

// Type helper for cart with totals (these exist at runtime but not in type definitions)
type CartWithTotals = any;

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const {
      cart_id,
      payment_collection_id,
      payment_session_id,
      selected_item_ids,
    } = req.body as {
      cart_id: string;
      payment_collection_id?: string;
      payment_session_id?: string;
      selected_item_ids?: string[]; // Array of selected line item IDs
    };

    if (!cart_id) {
      res.status(400).json({
        error: "cart_id is required",
      });
      return;
    }

    console.log("[Stripe Checkout] Creating session with:", {
      cart_id,
      payment_collection_id,
      payment_session_id,
      selected_item_ids: selected_item_ids?.length || "all items",
    });

    // Use Medusa SDK to fetch cart (no external HTTP call needed)
    const query = req.scope.resolve("query");

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
        "region.*",
        "region.countries.*",
        "items.*",
        "items.product.*",
        "items.variant.*",
        "items.thumbnail",
        "items.metadata",
        "items.unit_price",
        "items.subtotal",
        "items.total",
        "items.original_total",
        "items.discount_total",
        "items.quantity",
        "items.title",
        "shipping_address.*",
        "shipping_methods.*",
        "shipping_methods.amount",
        "promotions.*",
        "promotions.code",
      ],
      filters: { id: cart_id },
    });

    const cart = carts?.[0];

    if (!cart) {
      res.status(404).json({
        error: "Cart not found",
      });
      return;
    }

    // Log cart data for debugging
    console.log("[Stripe Checkout] Cart data:", {
      id: cart.id,
      email: cart.email,
      total: cart.total,
      subtotal: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      items_count: cart.items?.length,
      promotions: cart.promotions?.map((p: any) => p.code),
      items: cart.items?.map((item: any) => ({
        title: item.title,
        unit_price: item.unit_price,
        unit_price_type: typeof item.unit_price,
        quantity: item.quantity,
        discount_total: item.discount_total,
      })),
      shipping_methods: cart.shipping_methods?.map((sm: any) => ({
        name: sm.name,
        amount: sm.amount,
        amount_type: typeof sm.amount,
      })),
    });

    // Validate cart has items
    if (!cart.items || cart.items.length === 0) {
      res.status(400).json({
        error: "Cart is empty",
      });
      return;
    }

    // Filter cart items if selected_item_ids provided
    let itemsToCheckout = cart.items;
    if (selected_item_ids && selected_item_ids.length > 0) {
      itemsToCheckout = cart.items.filter((item: any) =>
        selected_item_ids.includes(item.id),
      );

      console.log("[Stripe Checkout] Filtered items:", {
        total_items: cart.items.length,
        selected_items: itemsToCheckout.length,
        selected_ids: selected_item_ids,
      });

      if (itemsToCheckout.length === 0) {
        res.status(400).json({
          error: "No selected items found in cart",
        });
        return;
      }

      // Store selected item IDs in session metadata for webhook
      cart.metadata = cart.metadata || {};
      cart.metadata.selected_item_ids = selected_item_ids.join(",");
    } else {
      console.log("[Stripe Checkout] No item selection - using all cart items");
    }

    // Validate cart has shipping address
    if (!cart.shipping_address) {
      res.status(400).json({
        error: "Shipping address is required",
      });
      return;
    }

    // Validate cart has email
    if (!cart.email) {
      res.status(400).json({
        error: "Email is required",
      });
      return;
    }

    // Helper function to safely convert Medusa amounts to Stripe integers
    const toStripeAmount = (value: any, itemName?: string): number => {
      console.log(
        `[Stripe Checkout] Converting amount for ${itemName || "item"}:`,
        {
          value,
          type: typeof value,
          isObject: typeof value === "object",
          hasToString: value && typeof value.toString === "function",
          stringValue: value ? value.toString() : "null/undefined",
        },
      );

      if (value === null || value === undefined) {
        console.warn(
          `[Stripe Checkout] ⚠️ Null/undefined value for ${itemName}`,
        );
        return 0;
      }

      // Handle BigNumber/Decimal objects from Medusa
      let numValue: number;

      // Check if it's a BigNumber object with numeric_ property
      if (typeof value === "object" && value.numeric_ !== undefined) {
        numValue = Math.round(value.numeric_ * 100); // Convert to cents
        console.log(
          `[Stripe Checkout] ✅ Converted BigNumber ${itemName}: ${value.numeric_} → ${numValue}`,
        );
        return numValue;
      }

      // Check if it has raw_ property with value
      if (typeof value === "object" && value.raw_ && value.raw_.value) {
        const floatValue = parseFloat(value.raw_.value);
        numValue = Math.round(floatValue * 100); // Convert to cents
        console.log(
          `[Stripe Checkout] ✅ Converted raw value ${itemName}: ${value.raw_.value} → ${numValue}`,
        );
        return numValue;
      }

      // Try standard conversion
      let stringValue = String(value);
      stringValue = stringValue.replace(/[^\d.-]/g, "");
      numValue = parseInt(stringValue);

      if (isNaN(numValue)) {
        console.error(`[Stripe Checkout] ❌ NaN result for ${itemName}:`, {
          original: value,
          stringValue,
          parsed: numValue,
        });
        return 0;
      }

      console.log(
        `[Stripe Checkout] ✅ Converted ${itemName}: ${value} → ${numValue}`,
      );
      return numValue;
    };

    // Map cart items to Stripe line items
    // Note: Medusa stores prices as BigNumber/Decimal objects, need to convert to integer
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Check if we can use individual item prices
    let hasInvalidPrices = false;
    for (const item of itemsToCheckout) {
      const unitAmount = toStripeAmount(item.unit_price, item.title);
      if (unitAmount <= 0) {
        console.warn(
          `[Stripe Checkout] ⚠️ Item ${item.title} has invalid price, will use cart total`,
        );
        hasInvalidPrices = true;
        break;
      }
    }

    if (hasInvalidPrices) {
      // Fallback: Calculate total from selected items
      const selectedTotal = itemsToCheckout.reduce((sum: number, item: any) => {
        return (
          sum + toStripeAmount(item.unit_price, item.title) * item.quantity
        );
      }, 0);

      if (selectedTotal <= 0) {
        throw new Error("Cart total is invalid. Please refresh and try again.");
      }

      console.log(
        `[Stripe Checkout] Using selected items total fallback: ${selectedTotal}`,
      );

      lineItems.push({
        price_data: {
          currency: cart.region.currency_code.toLowerCase(),
          product_data: {
            name: "Order Total",
            description: `${itemsToCheckout.length} item(s)`,
          },
          unit_amount: selectedTotal,
        },
        quantity: 1,
      });
    } else {
      // Use individual item prices for selected items only
      itemsToCheckout.forEach((item: any) => {
        const unitAmount = toStripeAmount(item.unit_price, item.title);

        lineItems.push({
          price_data: {
            currency: cart.region.currency_code.toLowerCase(),
            product_data: {
              name: item.title,
              description: item.variant?.title || "",
              images: item.thumbnail ? [item.thumbnail] : [],
              metadata: {
                product_id: item.product_id,
                variant_id: item.variant_id,
              },
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      });
    }

    // Add shipping as a line item if present (only if not using fallback)
    if (
      !hasInvalidPrices &&
      cart.shipping_methods &&
      cart.shipping_methods.length > 0
    ) {
      const shippingMethod = cart.shipping_methods[0];
      const shippingAmount = toStripeAmount(
        shippingMethod.amount,
        `Shipping: ${shippingMethod.name}`,
      );

      if (shippingAmount > 0) {
        lineItems.push({
          price_data: {
            currency: cart.region.currency_code.toLowerCase(),
            product_data: {
              name: `Shipping: ${shippingMethod.name}`,
              description: "Delivery fee",
            },
            unit_amount: shippingAmount,
          },
          quantity: 1,
        });
      }
    }

    // Add tax as a line item if present (only if not using fallback)
    if (!hasInvalidPrices && cart.tax_total && cart.tax_total > 0) {
      const taxAmount = toStripeAmount(cart.tax_total, "Tax");

      if (taxAmount > 0) {
        lineItems.push({
          price_data: {
            currency: cart.region.currency_code.toLowerCase(),
            product_data: {
              name: "Tax",
              description: "Sales tax",
            },
            unit_amount: taxAmount,
          },
          quantity: 1,
        });
      }
    }

    // Log line items for debugging
    console.log(
      "[Stripe Checkout] Line items:",
      JSON.stringify(lineItems, null, 2),
    );

    // Calculate discount information for Stripe
    let discountCoupons: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (cart.discount_total && cart.discount_total > 0) {
      const discountAmount = toStripeAmount(cart.discount_total, "Discount");

      if (discountAmount > 0) {
        // Get promotion codes for coupon name
        const promoDescription = cart.promotions
          ?.map((p: any) => p.code)
          .filter(Boolean)
          .join(", ");

        console.log(
          `[Stripe Checkout] Creating coupon for discount: ${discountAmount} (${promoDescription})`,
        );

        // Create a one-time coupon for this discount
        try {
          const coupon = await stripe.coupons.create({
            amount_off: discountAmount,
            currency: cart.region.currency_code.toLowerCase(),
            duration: "once",
            name: promoDescription || "Discount",
            metadata: {
              cart_id: cart.id,
              promo_codes: promoDescription || "",
            },
          });

          discountCoupons.push({
            coupon: coupon.id,
          });

          console.log(
            `[Stripe Checkout] ✅ Created coupon: ${coupon.id} for ${discountAmount}`,
          );
        } catch (couponError: any) {
          console.error(
            "[Stripe Checkout] Failed to create coupon:",
            couponError,
          );
          // Continue without discount if coupon creation fails
        }
      }
    }

    // Get origin for success/cancel URLs
    const origin =
      req.headers.origin ||
      process.env.STOREFRONT_URL ||
      "http://localhost:8000";

    // Get country code for redirect URLs
    const countryCode = cart.region.countries?.[0]?.iso_2 || "ph";

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      customer_email: cart.email,
      success_url: `${origin}/${countryCode}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${countryCode}/checkout/failed?reason=canceled`,
      metadata: {
        cart_id: cart.id,
        region_id: cart.region_id,
      },
      payment_intent_data: {
        metadata: {
          cart_id: cart.id,
          region_id: cart.region_id,
          selected_item_ids: selected_item_ids?.join(",") || "", // Store selected items
        },
      },
      // Automatically expire after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    };

    // Add discounts if present
    if (discountCoupons.length > 0) {
      sessionParams.discounts = discountCoupons;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("[Stripe Checkout] Session created:", {
      session_id: session.id,
      cart_id: cart.id,
      amount: (cart as any).total,
      currency: (cart.region as any)?.currency_code || "php",
    });

    // Return the checkout URL
    res.status(200).json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error: any) {
    console.error("[Stripe Checkout] Error creating session:", error);
    res.status(500).json({
      error: error.message || "Failed to create checkout session",
    });
  }
}
