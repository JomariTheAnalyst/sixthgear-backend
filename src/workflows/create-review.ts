import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createReviewStep } from "./steps/create-review";

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
 * Workflow: Create Review
 * Creates a new product review
 */
export const createReviewWorkflow = createWorkflow(
  "create-review",
  (input: CreateReviewInput) => {
    const review = createReviewStep(input);
    return new WorkflowResponse(review);
  },
);
