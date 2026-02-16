import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review";

type CreateReviewInput = {
  title: string;
  content: string;
  rating: number;
  first_name?: string;
  last_name?: string;
  product_id: string;
  customer_id?: string;
};

/**
 * Step: Create Review
 * Creates a new product review with pending status
 */
export const createReviewStep = createStep(
  "create-review-step",
  async (input: CreateReviewInput, { container }) => {
    const productReviewService = container.resolve(PRODUCT_REVIEW_MODULE);

    const review = await productReviewService.createReviews({
      ...input,
      status: "pending",
    });

    return new StepResponse(review, review.id);
  },
  async (reviewId, { container }) => {
    if (!reviewId) return;

    const productReviewService = container.resolve(PRODUCT_REVIEW_MODULE);
    await productReviewService.deleteReviews(reviewId);
  },
);
