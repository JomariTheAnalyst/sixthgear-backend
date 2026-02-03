import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { WISHLIST_MODULE } from "../../../../../modules/wishlist";

/**
 * Store API: Remove Item from Wishlist
 * DELETE /store/wishlist/items/:id
 *
 * Removes a specific item from the authenticated customer's wishlist
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const wishlistService = req.scope.resolve(WISHLIST_MODULE);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

    // Check authentication
    const customerId = (req as any).auth_context?.actor_id;
    if (!customerId) {
      res.status(401).json({
        message:
          "Authentication required. Please log in to manage your wishlist.",
      });
      return;
    }

    const itemId = req.params.id;

    if (!itemId) {
      res.status(400).json({
        message: "Item ID is required",
      });
      return;
    }

    // Get the item to verify ownership
    const item = await wishlistService
      .listWishlistItems({
        id: itemId,
      })
      .then((items: any[]) => items[0]);

    if (!item) {
      res.status(404).json({
        message: "Wishlist item not found",
      });
      return;
    }

    // Verify the item belongs to the customer's wishlist
    const wishlist = await wishlistService
      .listWishlists({
        id: item.wishlist_id,
      })
      .then((wishlists: any[]) => wishlists[0]);

    if (!wishlist || wishlist.customer_id !== customerId) {
      res.status(403).json({
        message: "You don't have permission to remove this item",
      });
      return;
    }

    // Delete the item
    await wishlistService.deleteWishlistItems(itemId);

    logger.info(
      `Removed item ${itemId} from wishlist ${wishlist.id} for customer ${customerId}`,
    );

    res.status(200).json({
      message: "Item removed from wishlist successfully",
      id: itemId,
    });
  } catch (error) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error("Error removing item from wishlist:", error);

    res.status(500).json({
      message: "An error occurred while removing the item from your wishlist.",
    });
  }
}
