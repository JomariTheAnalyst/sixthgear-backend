import { model } from "@medusajs/framework/utils";

/**
 * Wishlist Model
 * Each customer has exactly one wishlist
 */
const Wishlist = model.define("wishlist", {
  id: model.id().primaryKey(),

  // Customer relationship (one-to-one)
  customer_id: model.text().unique(),

  // Timestamps are automatically added by Medusa (created_at, updated_at)
});

export default Wishlist;
