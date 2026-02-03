import { MedusaService } from "@medusajs/framework/utils";
import Wishlist from "./models/wishlist";
import WishlistItem from "./models/wishlist-item";

/**
 * Wishlist Service
 * Handles all business logic for customer wishlists
 */
class WishlistModuleService extends MedusaService({
  Wishlist,
  WishlistItem,
}) {}

export default WishlistModuleService;
