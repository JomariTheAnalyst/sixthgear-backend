import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { createReviewWorkflow } from "../../../workflows/create-review";
import { PostStoreReviewSchema } from "../../middlewares";
import { z } from "zod";

type PostStoreReviewReq = z.infer<typeof PostStoreReviewSchema>;

/**
 * Store API: Create Review
 * POST /store/reviews
 *
 * Creates a new product review (authenticated customers only)
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<PostStoreReviewReq>,
  res: MedusaResponse,
) => {
  const input = req.validatedBody;

  const { result } = await createReviewWorkflow(req.scope).run({
    input: {
      ...input,
      customer_id: req.auth_context?.actor_id,
    },
  });

  res.status(201).json({
    message: "Review submitted successfully and is pending approval",
    review: result,
  });
};
