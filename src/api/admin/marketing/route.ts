import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/marketing
 * List all marketing items (admin only)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { type, status } = req.query as {
      type?: string;
      status?: string;
    };

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;

    const { data: items } = await query.graph({
      entity: "marketing_item",
      fields: ["*"],
      filters,
    });

    // Sort by priority then created_at
    items.sort((a: any, b: any) => {
      if (b.priority !== a.priority)
        return (b.priority || 0) - (a.priority || 0);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return res.json({ marketing_items: items });
  } catch (error) {
    console.error("[Admin Marketing] Error listing:", error);
    return res.status(500).json({ error: "Failed to list marketing items" });
  }
};

/**
 * POST /admin/marketing
 * Create a new marketing item
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const body = req.body as any;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Validate required fields
    if (!body.type || !["strip", "banner", "popup"].includes(body.type)) {
      return res
        .status(400)
        .json({ error: "Invalid type. Must be strip, banner, or popup" });
    }

    // Create the item using the marketing module
    const marketingModule = req.scope.resolve("marketing") as any;

    const item = await marketingModule.createMarketingItems({
      type: body.type,
      status: body.status || "draft",
      title: body.title,
      message: body.message,
      cta_text: body.cta_text,
      cta_url: body.cta_url,
      image_desktop_url: body.image_desktop_url,
      image_mobile_url: body.image_mobile_url,
      background_color: body.background_color,
      text_color: body.text_color,
      enabled: body.enabled ?? true,
      priority: body.priority || 0,
      start_at: body.start_at,
      end_at: body.end_at,
      pages: body.pages || ["/"],
      device: body.device || "all",
      placement: body.placement,
      delay_ms: body.delay_ms || 2000,
      frequency: body.frequency || "once_session",
      dismiss_key: body.dismiss_key,
    });

    return res.status(201).json({ marketing_item: item });
  } catch (error) {
    console.error("[Admin Marketing] Error creating:", error);
    return res.status(500).json({ error: "Failed to create marketing item" });
  }
};
