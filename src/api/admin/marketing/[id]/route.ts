import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/marketing/:id
 * Get a single marketing item
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: items } = await query.graph({
      entity: "marketing_item",
      fields: ["*"],
      filters: { id },
    });

    if (!items || items.length === 0) {
      return res.status(404).json({ error: "Marketing item not found" });
    }

    return res.json({ marketing_item: items[0] });
  } catch (error) {
    console.error("[Admin Marketing] Error getting:", error);
    return res.status(500).json({ error: "Failed to get marketing item" });
  }
};

/**
 * PUT /admin/marketing/:id
 * Update a marketing item
 */
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const body = req.body as any;

    const marketingModule = req.scope.resolve("marketing") as any;

    const item = await marketingModule.updateMarketingItems({
      id,
      ...body,
    });

    return res.json({ marketing_item: item });
  } catch (error) {
    console.error("[Admin Marketing] Error updating:", error);
    return res.status(500).json({ error: "Failed to update marketing item" });
  }
};

/**
 * DELETE /admin/marketing/:id
 * Delete a marketing item
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;

    const marketingModule = req.scope.resolve("marketing") as any;

    await marketingModule.deleteMarketingItems(id);

    return res.json({ success: true });
  } catch (error) {
    console.error("[Admin Marketing] Error deleting:", error);
    return res.status(500).json({ error: "Failed to delete marketing item" });
  }
};
