/**
 * Wishlist Module Types
 */

export type CreateWishlistDTO = {
  customer_id: string;
};

export type CreateWishlistItemDTO = {
  wishlist_id: string;
  variant_id: string;
  product_id?: string;
};

export type UpdateWishlistItemDTO = {
  variant_id?: string;
  product_id?: string;
};

export type WishlistDTO = {
  id: string;
  customer_id: string;
  created_at: Date;
  updated_at: Date;
};

export type WishlistItemDTO = {
  id: string;
  wishlist_id: string;
  variant_id: string;
  product_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type WishlistWithItemsDTO = WishlistDTO & {
  items: WishlistItemDTO[];
};
