import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PRODUCT_REVIEW_MODULE } from "../modules/product-review";

export default async function checkReviews({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const reviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE);

  logger.info("=== Checking Reviews ===");

  try {
    // Get all reviews
    const { metadata, data: allReviews } =
      await reviewModuleService.listReviews();
    logger.info(`Total reviews in database: ${metadata?.count || 0}`);

    if (allReviews && allReviews.length > 0) {
      allReviews.forEach((review: any) => {
        logger.info(`\nReview ID: ${review.id}`);
        logger.info(`Product ID: ${review.product_id}`);
        logger.info(`Status: ${review.status}`);
        logger.info(`Rating: ${review.rating}`);
        logger.info(`Title: ${review.title || "N/A"}`);
        logger.info(`Content: ${review.content?.substring(0, 50)}...`);
        logger.info(`Customer: ${review.first_name} ${review.last_name}`);
      });

      // Check approved reviews
      const { metadata: approvedMeta } = await reviewModuleService.listReviews({
        status: "approved",
      });
      logger.info(`\n=== Approved Reviews: ${approvedMeta?.count || 0} ===`);

      // Check pending reviews
      const { metadata: pendingMeta } = await reviewModuleService.listReviews({
        status: "pending",
      });
      logger.info(`Pending Reviews: ${pendingMeta?.count || 0}`);

      // Check rejected reviews
      const { metadata: rejectedMeta } = await reviewModuleService.listReviews({
        status: "rejected",
      });
      logger.info(`Rejected Reviews: ${rejectedMeta?.count || 0}`);

      // Test rating endpoint for first product with review
      if (allReviews.length > 0) {
        const firstReview = allReviews[0];
        const avgRating = await reviewModuleService.getAverageRating(
          firstReview.product_id,
        );
        logger.info(
          `\nAverage rating for product ${firstReview.product_id}: ${avgRating}`,
        );
      }
    } else {
      logger.info("No reviews found in database");
    }
  } catch (error) {
    logger.error("Error checking reviews:", error);
  }
}
