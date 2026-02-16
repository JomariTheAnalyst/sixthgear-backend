import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Backfill Script: Compute and store rating aggregates for all products
 * Run this once to populate metadata.rating_average and metadata.rating_count
 */
export default async function backfillProductRatings({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("=== Backfilling Product Ratings ===");

  try {
    // Get all approved reviews grouped by product
    const { data: reviews } = await query.graph({
      entity: "review",
      filters: {
        status: "approved",
      },
      fields: ["product_id", "rating"],
    });

    if (!reviews || reviews.length === 0) {
      logger.info("No approved reviews found");
      return;
    }

    // Group by product_id
    const productRatings: Record<string, { sum: number; count: number }> = {};

    reviews.forEach((review: any) => {
      if (!productRatings[review.product_id]) {
        productRatings[review.product_id] = { sum: 0, count: 0 };
      }
      productRatings[review.product_id].sum += review.rating;
      productRatings[review.product_id].count += 1;
    });

    // Update each product
    logger.info(
      `Updating ${Object.keys(productRatings).length} products with rating data...`,
    );

    for (const [productId, { sum, count }] of Object.entries(productRatings)) {
      const average = parseFloat((sum / count).toFixed(1));

      // Fetch current product to preserve existing metadata
      const [product] = await productModuleService.listProducts({
        id: [productId],
      });

      if (product) {
        await productModuleService.updateProducts(productId, {
          metadata: {
            ...(product.metadata || {}),
            rating_average: average,
            rating_count: count,
          },
        });

        logger.info(`Product ${productId}: ${average} (${count} reviews)`);
      }
    }

    logger.info("✅ Backfill complete!");
  } catch (error) {
    logger.error("Error backfilling ratings:", error);
  }
}
