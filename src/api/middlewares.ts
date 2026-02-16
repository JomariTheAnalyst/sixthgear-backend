import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

// Store: Create Review Schema
export const PostStoreReviewSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(10, "Review must be at least 10 characters"),
  rating: z.preprocess((val) => {
    if (val && typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }, z.number().min(1).max(5)),
  product_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});

// Store: Get Reviews Schema
export const GetStoreReviewsSchema = createFindParams();

// Admin: Get Reviews Schema
export const GetAdminReviewsSchema = createFindParams();

// Admin: Update Review Status Schema
export const PostAdminUpdateReviewsStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
});

/**
 * API Middlewares
 * Define validation and authentication rules for API routes
 */
export default defineMiddlewares({
  routes: [
    // Store: Create Review (authenticated customers only)
    {
      matcher: "/store/reviews",
      method: ["POST"],
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreReviewSchema),
      ],
    },
    // Store: Get Product Reviews (public)
    {
      matcher: "/store/products/:id/reviews",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetStoreReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "rating",
            "title",
            "first_name",
            "last_name",
            "content",
            "created_at",
          ],
        }),
      ],
    },
    // Admin: List Reviews
    {
      matcher: "/admin/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "title",
            "content",
            "rating",
            "product_id",
            "customer_id",
            "status",
            "created_at",
            "updated_at",
            "product.*",
          ],
        }),
      ],
    },
    // Admin: Update Review Status
    {
      matcher: "/admin/reviews/status",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminUpdateReviewsStatusSchema),
      ],
    },
  ],
});
