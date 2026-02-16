import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

type UpdateReviewInput = {
  id: string;
  status?: "pending" | "approved" | "rejected";
};

/**
 * Step: Update Review
 * Updates review status and recomputes product rating aggregates
 */
export const updateReviewStep = createStep(
  "update-review-step",
  async (input: UpdateReviewInput, { container }) => {
    const productReviewService = container.resolve(PRODUCT_REVIEW_MODULE);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Get review using direct query (module service has issues)
    const { data: reviews } = await query.graph({
      entity: "review",
      filters: { id: input.id },
      fields: ["id", "status", "product_id"],
    });

    const review = reviews?.[0];
    if (!review) {
      throw new Error(`Review with id ${input.id} not found`);
    }

    const previousStatus = review.status;
    const productId = review.product_id;

    // Update review status
    const updatedReview = await productReviewService.updateReviews([
      {
        id: input.id,
        status: input.status,
      },
    ]);

    // Recompute product rating aggregates if status changed to/from approved
    if (input.status === "approved" || previousStatus === "approved") {
      // Get all approved reviews for this product
      const { data: approvedReviews } = await query.graph({
        entity: "review",
        filters: {
          product_id: productId,
          status: "approved",
        },
        fields: ["rating"],
      });

      const count = approvedReviews?.length || 0;
      const average =
        count > 0
          ? parseFloat(
              (
                approvedReviews.reduce(
                  (sum: number, r: any) => sum + r.rating,
                  0,
                ) / count
              ).toFixed(1),
            )
          : 0;

      // Update product metadata
      const productModuleService = container.resolve(Modules.PRODUCT);

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
      }

      console.log(
        `[Review] Updated product ${productId} rating: ${average} (${count} reviews)`,
      );
    }

    return new StepResponse(updatedReview, {
      id: input.id,
      previousStatus,
      productId,
    });
  },
  async (data, { container }) => {
    if (!data) return;

    const productReviewService = container.resolve(PRODUCT_REVIEW_MODULE);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    // Rollback review status
    await productReviewService.updateReviews([
      {
        id: data.id,
        status: data.previousStatus,
      },
    ]);

    // Recompute aggregates on rollback
    const { data: approvedReviews } = await query.graph({
      entity: "review",
      filters: {
        product_id: data.productId,
        status: "approved",
      },
      fields: ["rating"],
    });

    const count = approvedReviews?.length || 0;
    const average =
      count > 0
        ? parseFloat(
            (
              approvedReviews.reduce(
                (sum: number, r: any) => sum + r.rating,
                0,
              ) / count
            ).toFixed(1),
          )
        : 0;

    const productModuleService = container.resolve(Modules.PRODUCT);

    // Fetch current product to preserve existing metadata
    const [product] = await productModuleService.listProducts({
      id: [data.productId],
    });

    if (product) {
      await productModuleService.updateProducts(data.productId, {
        metadata: {
          ...(product.metadata || {}),
          rating_average: average,
          rating_count: count,
        },
      });
    }
  },
);
