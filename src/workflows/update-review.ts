import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateReviewStep } from "./steps/update-review";

type UpdateReviewInput = {
  id: string;
  status?: "pending" | "approved" | "rejected";
};

/**
 * Workflow: Update Review
 * Updates review status (approve/reject)
 */
export const updateReviewWorkflow = createWorkflow(
  "update-review",
  (input: UpdateReviewInput) => {
    const review = updateReviewStep(input);
    return new WorkflowResponse(review);
  },
);
