import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Store API: Get Product Rating Summary
 * GET /store/products/:id/rating
 *
 * Returns average rating and review count for a product
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // Get approved reviews for this product using direct query
    const { data: reviews } = await query.graph({
      entity: "review",
      filters: {
        product_id: id,
        status: "approved",
      },
      fields: ["rating"],
    });

    const count = reviews?.length || 0;
    const averageRating =
      count > 0
        ? parseFloat(
            (
              reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count
            ).toFixed(2),
          )
        : 0;

    res.json({
      average_rating: averageRating,
      count,
    });
  } catch (error) {
    console.error("Error fetching product rating:", error);
    res.json({
      average_rating: 0,
      count: 0,
    });
  }
};
