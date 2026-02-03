import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { WISHLIST_MODULE } from "../../../../modules/wishlist";

/**
 * Store API: Add Item to Wishlist
 * POST /store/wishlist/items
 *
 * Adds a product variant to the authenticated customer's wishlist
 * Prevents duplicate items
 */
export async function POST(
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
          "Authentication required. Please log in to add items to your wishlist.",
      });
      return;
    }

    // Validate request body
    const body = req.body as {
      variant_id?: string;
      product_id?: string;
    };
    const { variant_id, product_id } = body;

    if (!variant_id) {
      res.status(400).json({
        message: "variant_id is required",
      });
      return;
    }

    // Find or create wishlist
    let wishlist = await wishlistService
      .listWishlists({
        customer_id: customerId,
      })
      .then((wishlists: any[]) => wishlists[0]);

    if (!wishlist) {
      wishlist = await wishlistService.createWishlists({
        customer_id: customerId,
      });
      logger.info(`Created new wishlist for customer: ${customerId}`);
    }

    // Check if item already exists
    const existingItems = await wishlistService.listWishlistItems({
      wishlist_id: wishlist.id,
      variant_id: variant_id,
    });

    if (existingItems && existingItems.length > 0) {
      res.status(409).json({
        message: "This item is already in your wishlist",
        item: existingItems[0],
      });
      return;
    }

    // Add item to wishlist
    const item = await wishlistService.createWishlistItems({
      wishlist_id: wishlist.id,
      variant_id: variant_id,
      product_id: product_id || null,
    });

    logger.info(
      `Added item ${variant_id} to wishlist ${wishlist.id} for customer ${customerId}`,
    );

    res.status(201).json({
      message: "Item added to wishlist successfully",
      item: {
        id: item.id,
        wishlist_id: item.wishlist_id,
        variant_id: item.variant_id,
        product_id: item.product_id,
        created_at: item.created_at,
      },
    });
  } catch (error: any) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error("Error adding item to wishlist:", error);

    // Handle unique constraint violation
    if (error.code === "23505" || error.message?.includes("unique")) {
      res.status(409).json({
        message: "This item is already in your wishlist",
      });
      return;
    }

    res.status(500).json({
      message: "An error occurred while adding the item to your wishlist.",
    });
  }
}
