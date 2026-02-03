import { model } from "@medusajs/framework/utils";

/**
 * Wishlist Item Model
 * Stores individual items in a customer's wishlist
 */
const WishlistItem = model
  .define("wishlist_item", {
    id: model.id().primaryKey(),

    // Wishlist relationship
    wishlist_id: model.text(),

    // Product/Variant information
    variant_id: model.text(),
    product_id: model.text().nullable(),

    // Timestamps are automatically added by Medusa (created_at, updated_at)
  })
  // Unique constraint: one variant per wishlist
  .indexes([
    {
      on: ["wishlist_id", "variant_id"],
      unique: true,
    },
  ]);

export default WishlistItem;
