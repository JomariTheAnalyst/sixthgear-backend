import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import crypto from "crypto";

const PREVIEW_TTL = 600; // 10 minutes in seconds
const STOREFRONT_URL = process.env.STOREFRONT_URL || "http://localhost:8000";

/**
 * POST /admin/marketing/:id/preview-token
 * Generate a preview token for viewing draft content on storefront
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params;
    const { redirect_path } = req.body as { redirect_path?: string };

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Verify the item exists
    const { data: items } = await query.graph({
      entity: "marketing_item",
      fields: ["id", "type", "pages"],
      filters: { id },
    });

    if (!items || items.length === 0) {
      return res.status(404).json({ error: "Marketing item not found" });
    }

    const item = items[0];

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Determine redirect path
    const pages = Array.isArray(item.pages) ? (item.pages as string[]) : [];
    const defaultPath =
      pages && pages.length > 0 ? pages[0].replace("/*", "") : "/";
    const redirectPath = redirect_path || defaultPath || "/";

    // Store token in memory with TTL
    (global as any).__previewTokens = (global as any).__previewTokens || {};
    (global as any).__previewTokens[token] = {
      itemId: id,
      redirectPath,
      expiresAt: Date.now() + PREVIEW_TTL * 1000,
    };

    // Build preview URL
    const previewUrl = `${STOREFRONT_URL}/api/preview?token=${token}&redirect=${encodeURIComponent(
      redirectPath,
    )}`;

    return res.json({
      token,
      preview_url: previewUrl,
      expires_in: PREVIEW_TTL,
    });
  } catch (error) {
    console.error("[Admin Marketing] Error creating preview token:", error);
    return res.status(500).json({ error: "Failed to create preview token" });
  }
};
