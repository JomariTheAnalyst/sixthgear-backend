import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function checkReviewsDirect({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("=== Checking Reviews (Direct Query) ===");

  try {
    // Direct query to review table
    const { data: reviews } = await query.graph({
      entity: "review",
      fields: ["*"],
    });

    logger.info(`Total reviews found: ${reviews?.length || 0}`);

    if (reviews && reviews.length > 0) {
      reviews.forEach((review: any) => {
        logger.info(`\nReview ID: ${review.id}`);
        logger.info(`Product ID: ${review.product_id}`);
        logger.info(`Status: ${review.status}`);
        logger.info(`Rating: ${review.rating}`);
        logger.info(`Customer: ${review.first_name} ${review.last_name}`);
      });
    } else {
      logger.info("No reviews found in database");
    }
  } catch (error) {
    logger.error("Error checking reviews:", error);
  }
}
