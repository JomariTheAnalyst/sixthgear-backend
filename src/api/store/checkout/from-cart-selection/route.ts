// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * Create Checkout Cart from Selected Items
 *
 * Creates a new temporary cart containing ONLY selected items from the original cart.
 * This checkout cart is used for completing the order, ensuring only selected items
 * are included in the order total, shipping calculation, and payment.
 *
 * POST /store/checkout/from-cart-selection
 *
 * Body:
 * - cart_id: string (required) - Original cart ID
 * - selected_line_item_ids: string[] (required) - Array of selected line item IDs
 *
 * Returns:
 * - checkout_cart_id: string - ID of the new checkout cart
 * - checkout_cart: object - Full checkout cart object
 */

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const { cart_id, selected_line_item_ids } = req.body as {
      cart_id: string;
      selected_line_item_ids: string[];
    };

    // Validate input
    if (!cart_id) {
      res.status(400).json({
        error: "cart_id is required",
      });
      return;
    }

    if (!selected_line_item_ids || selected_line_item_ids.length === 0) {
      res.status(400).json({
        error: "selected_line_item_ids is required and must not be empty",
      });
      return;
    }

    console.log("[Checkout Cart] Creating checkout cart from selection:", {
      cart_id,
      selected_items: selected_line_item_ids.length,
    });

    const query = req.scope.resolve("query");
    const cartModuleService = req.scope.resolve(Modules.CART);

    // Step 1: Get original cart with all data
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "region_id",
        "customer_id",
        "sales_channel_id",
        "currency_code",
        "items.*",
        "items.id",
        "items.variant_id",
        "items.product_id",
        "items.quantity",
        "items.unit_price",
        "items.title",
        "items.subtitle",
        "items.thumbnail",
        "items.metadata",
        "shipping_address.*",
        "billing_address.*",
        "promotions.*",
        "metadata",
      ],
      filters: { id: cart_id },
    });

    const originalCart = carts?.[0];

    if (!originalCart) {
      res.status(404).json({
        error: "Original cart not found",
      });
      return;
    }

    // Step 2: Validate selected items belong to this cart
    const selectedItems = originalCart.items.filter((item: any) =>
      selected_line_item_ids.includes(item.id),
    );

    if (selectedItems.length === 0) {
      res.status(400).json({
        error: "No valid selected items found in cart",
      });
      return;
    }

    if (selectedItems.length !== selected_line_item_ids.length) {
      console.warn(
        "[Checkout Cart] ⚠️ Some selected item IDs not found in cart",
      );
    }

    console.log("[Checkout Cart] Selected items validated:", {
      requested: selected_line_item_ids.length,
      found: selectedItems.length,
    });

    // Step 3: Create new checkout cart
    console.log("[Checkout Cart] Creating new checkout cart...");

    const checkoutCart = await cartModuleService.createCarts({
      region_id: originalCart.region_id,
      customer_id: originalCart.customer_id,
      sales_channel_id: originalCart.sales_channel_id,
      email: originalCart.email,
      currency_code: originalCart.currency_code,
      metadata: {
        ...originalCart.metadata,
        is_checkout_cart: true,
        original_cart_id: cart_id,
        selected_item_ids: selected_line_item_ids,
      },
    });

    console.log("[Checkout Cart] ✅ Checkout cart created:", checkoutCart.id);

    // Step 4: Copy shipping and billing addresses
    if (originalCart.shipping_address || originalCart.billing_address) {
      console.log("[Checkout Cart] Copying addresses...");

      await cartModuleService.updateCarts(checkoutCart.id, {
        shipping_address: originalCart.shipping_address
          ? {
              first_name: originalCart.shipping_address.first_name,
              last_name: originalCart.shipping_address.last_name,
              address_1: originalCart.shipping_address.address_1,
              address_2: originalCart.shipping_address.address_2,
              company: originalCart.shipping_address.company,
              postal_code: originalCart.shipping_address.postal_code,
              city: originalCart.shipping_address.city,
              country_code: originalCart.shipping_address.country_code,
              province: originalCart.shipping_address.province,
              phone: originalCart.shipping_address.phone,
              metadata: originalCart.shipping_address.metadata,
            }
          : undefined,
        billing_address: originalCart.billing_address
          ? {
              first_name: originalCart.billing_address.first_name,
              last_name: originalCart.billing_address.last_name,
              address_1: originalCart.billing_address.address_1,
              address_2: originalCart.billing_address.address_2,
              company: originalCart.billing_address.company,
              postal_code: originalCart.billing_address.postal_code,
              city: originalCart.billing_address.city,
              country_code: originalCart.billing_address.country_code,
              province: originalCart.billing_address.province,
              phone: originalCart.billing_address.phone,
              metadata: originalCart.billing_address.metadata,
            }
          : undefined,
      });

      console.log("[Checkout Cart] ✅ Addresses copied");
    }

    // Step 5: Add selected items to checkout cart
    console.log("[Checkout Cart] Adding selected items...");

    // We need to get full variant details to properly add items
    const productModuleService = req.scope.resolve(Modules.PRODUCT);

    for (const item of selectedItems) {
      // Get variant with product details
      const variant = await productModuleService.retrieveProductVariant(
        item.variant_id,
        {
          relations: ["product"],
        },
      );

      if (!variant) {
        console.warn(
          `[Checkout Cart] ⚠️ Variant not found: ${item.variant_id}`,
        );
        continue;
      }

      // Add line item with all required fields
      await cartModuleService.addLineItems(checkoutCart.id, [
        {
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price, // Preserve original price
          title: item.title || variant.product.title, // Use original title or product title
          subtitle: item.subtitle || variant.title, // Use original subtitle or variant title
          thumbnail: item.thumbnail || variant.product.thumbnail, // Use original thumbnail or product thumbnail
          metadata: item.metadata || {},
        },
      ]);

      console.log(
        `[Checkout Cart] ✅ Added item: ${item.title || variant.product.title} (qty: ${item.quantity})`,
      );
    }

    console.log("[Checkout Cart] ✅ All selected items added to checkout cart");

    // Step 6: Apply promotions if any (optional - promotions will auto-apply based on cart contents)
    if (originalCart.promotions && originalCart.promotions.length > 0) {
      console.log("[Checkout Cart] Original cart has promotions:", {
        count: originalCart.promotions.length,
      });
      // Promotions will be automatically evaluated by Medusa based on cart contents
      // No need to manually copy them
    }

    // Step 7: Get the complete checkout cart with calculated totals
    const { data: checkoutCarts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "region_id",
        "customer_id",
        "sales_channel_id",
        "currency_code",
        "items.*",
        "items.variant_id",
        "items.product_id",
        "items.quantity",
        "items.unit_price",
        "items.title",
        "items.subtitle",
        "items.thumbnail",
        "items.total",
        "items.subtotal",
        "items.tax_total",
        "shipping_address.*",
        "billing_address.*",
        "promotions.*",
        "metadata",
        "subtotal",
        "total",
        "tax_total",
        "shipping_total",
        "discount_total",
      ],
      filters: { id: checkoutCart.id },
    });

    const completeCheckoutCart = checkoutCarts?.[0];

    console.log("[Checkout Cart] ✅ Checkout cart ready:", {
      checkout_cart_id: checkoutCart.id,
      items_count: completeCheckoutCart.items?.length,
      subtotal: completeCheckoutCart.subtotal,
      total: completeCheckoutCart.total,
    });

    res.status(200).json({
      checkout_cart_id: checkoutCart.id,
      checkout_cart: completeCheckoutCart,
    });
  } catch (error: any) {
    console.error("[Checkout Cart] Error:", error.message);
    console.error("[Checkout Cart] Stack:", error.stack);

    res.status(500).json({
      error: error.message || "Failed to create checkout cart",
    });
  }
}
