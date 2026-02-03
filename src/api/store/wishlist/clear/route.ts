import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { WISHLIST_MODULE } from "../../../../modules/wishlist";

/**
 * Store API: Clear Wishlist
 * DELETE /store/wishlist/clear
 *
 * Removes all items from the authenticated customer's wishlist
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

    // Find customer's wishlist
    const wishlist = await wishlistService
      .listWishlists({
        customer_id: customerId,
      })
      .then((wishlists: any[]) => wishlists[0]);

    if (!wishlist) {
      res.status(404).json({
        message: "Wishlist not found",
      });
      return;
    }

    // Get all items
    const items = await wishlistService.listWishlistItems({
      wishlist_id: wishlist.id,
    });

    // Delete all items
    if (items && items.length > 0) {
      for (const item of items) {
        await wishlistService.deleteWishlistItems(item.id);
      }
    }

    logger.info(
      `Cleared ${items?.length || 0} items from wishlist ${wishlist.id} for customer ${customerId}`,
    );

    res.status(200).json({
      message: "Wishlist cleared successfully",
      removed_count: items?.length || 0,
    });
  } catch (error) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error("Error clearing wishlist:", error);

    res.status(500).json({
      message: "An error occurred while clearing your wishlist.",
    });
  }
}
