import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Store API: Check if Customer Purchased Product
 * GET /store/products/:id/purchased
 *
 * Checks if the authenticated customer has purchased this product
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const { id: productId } = req.params;
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    return res.json({ purchased: false });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // Query orders for this customer that contain this product
    // Valid Medusa v2 order statuses: pending, completed, archived, canceled, requires_action
    const { data: orders } = await query.graph({
      entity: "order",
      filters: {
        customer_id: customerId,
        status: ["pending", "completed"],
      },
      fields: ["id", "items.*"],
    });

    // Check if any order contains this product
    const hasPurchased = orders.some((order: any) =>
      order.items?.some((item: any) => item.product_id === productId),
    );

    res.json({ purchased: hasPurchased });
  } catch (error) {
    console.error("Error checking purchase history:", error);
    res.json({ purchased: false });
  }
};
