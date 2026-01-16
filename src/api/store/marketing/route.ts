import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /store/marketing
 * Returns marketing content filtered by path, device, and schedule
 *
 * Query params:
 * - path: current page path (required)
 * - device: "mobile" | "desktop" (optional)
 * - country: country code (optional, for future geo-targeting)
 * - preview_token: preview token for draft content (optional)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { path, device, preview_token } = req.query as {
      path?: string;
      device?: "mobile" | "desktop";
      preview_token?: string;
    };

    if (!path) {
      return res
        .status(400)
        .json({ error: "path query parameter is required" });
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Check if preview token is valid (if provided)
    let previewItemId: string | undefined;
    let includePreview = false;

    if (preview_token) {
      // Validate preview token from in-memory store
      const tokens = (global as any).__previewTokens || {};
      const tokenData = tokens[preview_token];
      if (tokenData && tokenData.expiresAt > Date.now()) {
        previewItemId = tokenData.itemId;
        includePreview = true;
      }
    }

    // Build filters
    const now = new Date();
    const filters: any = {
      enabled: true,
    };

    // Status filter
    if (includePreview && previewItemId) {
      // Include the preview item regardless of status
      filters.$or = [{ status: "published" }, { id: previewItemId }];
    } else {
      filters.status = "published";
    }

    // Query marketing items
    const { data: items } = await query.graph({
      entity: "marketing_item",
      fields: [
        "id",
        "type",
        "status",
        "title",
        "message",
        "cta_text",
        "cta_url",
        "image_desktop_url",
        "image_mobile_url",
        "background_color",
        "text_color",
        "enabled",
        "priority",
        "start_at",
        "end_at",
        "pages",
        "device",
        "placement",
        "delay_ms",
        "frequency",
        "dismiss_key",
        "created_at",
        "updated_at",
      ],
      filters,
    });

    // Filter by schedule and path in memory
    const filtered = items.filter((item: any) => {
      // Check schedule
      if (item.start_at && new Date(item.start_at) > now) return false;
      if (item.end_at && new Date(item.end_at) < now) return false;

      // Check device
      if (item.device !== "all" && device && item.device !== device) {
        return false;
      }

      // Check pages (supports wildcards)
      const pages = item.pages as string[];
      if (pages && pages.length > 0) {
        const matches = pages.some((pattern: string) => {
          if (pattern === "*" || pattern === "/*") return true;
          if (pattern.endsWith("/*")) {
            const prefix = pattern.slice(0, -2);
            return path.startsWith(prefix);
          }
          return path === pattern;
        });
        if (!matches) return false;
      }

      return true;
    });

    // Sort by priority (highest first)
    filtered.sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));

    // Group by type
    const strip = filtered.find((i: any) => i.type === "strip") || null;
    const banners = filtered.filter((i: any) => i.type === "banner");
    const popups = filtered.filter((i: any) => i.type === "popup");

    return res.json({ strip, banners, popups });
  } catch (error) {
    console.error("[Marketing API] Error:", error);
    return res.status(500).json({ error: "Failed to fetch marketing content" });
  }
};
