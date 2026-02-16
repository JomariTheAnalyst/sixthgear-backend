import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PRODUCT_REVIEW_MODULE } from "../../../modules/product-review";

/**
 * Admin API: List Reviews
 * GET /admin/reviews
 *
 * Lists all product reviews with optional filters
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const productReviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

    const {
      status,
      product_id,
      limit = 50,
      offset = 0,
    } = req.query as {
      status?: "pending" | "approved" | "rejected";
      product_id?: string;
      limit?: number;
      offset?: number;
    };

    const filters: any = {};
    if (status) filters.status = status;
    if (product_id) filters.product_id = product_id;

    const reviews = await productReviewService.listReviews(filters, {
      take: Number(limit),
      skip: Number(offset),
    });

    logger.info(`Listed ${reviews.length} reviews`);

    res.json({
      reviews,
      count: reviews.length,
    });
  } catch (error: any) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error("Error listing reviews:", error);

    res.status(500).json({
      message: "An error occurred while fetching reviews",
    });
  }
}
