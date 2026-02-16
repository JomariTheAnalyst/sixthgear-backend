import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateReviewWorkflow } from "../../../../workflows/update-review";

/**
 * Admin API: Update Review Status
 * POST /admin/reviews/status
 *
 * Approves or rejects a review
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

    const body = req.body as {
      id: string;
      status: "pending" | "approved" | "rejected";
    };

    logger.info(`Updating review ${body.id} status to ${body.status}`);

    // Execute workflow
    const { result } = await updateReviewWorkflow(req.scope).run({
      input: body,
    });

    logger.info(`Review ${body.id} status updated successfully`);

    res.json({
      message: `Review ${body.status} successfully`,
      review: result,
    });
  } catch (error: any) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error("Error updating review status:", error);

    res.status(500).json({
      message: "An error occurred while updating the review",
    });
  }
}
