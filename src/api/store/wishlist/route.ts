import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { WISHLIST_MODULE } from "../../../modules/wishlist";

/**
 * Store API: Get Customer Wishlist
 * GET /store/wishlist
 *
 * Returns the authenticated customer's wishlist with all items
 * Creates a new wishlist if one doesn't exist
 */
export async function GET(
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
          "Authentication required. Please log in to access your wishlist.",
      });
      return;
    }

    // Find or create wishlist for customer
    let wishlist = await wishlistService
      .listWishlists({
        customer_id: customerId,
      })
      .then((wishlists: any[]) => wishlists[0]);

    if (!wishlist) {
      // Create wishlist if it doesn't exist
      wishlist = await wishlistService.createWishlists({
        customer_id: customerId,
      });
      logger.info(`Created new wishlist for customer: ${customerId}`);
    }

    // Get wishlist items
    const items = await wishlistService.listWishlistItems({
      wishlist_id: wishlist.id,
    });

    res.status(200).json({
      wishlist: {
        id: wishlist.id,
        customer_id: wishlist.customer_id,
        created_at: wishlist.created_at,
        updated_at: wishlist.updated_at,
        items: items || [],
      },
    });
  } catch (error) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error("Error fetching wishlist:", error);

    res.status(500).json({
      message: "An error occurred while fetching your wishlist.",
    });
  }
}
