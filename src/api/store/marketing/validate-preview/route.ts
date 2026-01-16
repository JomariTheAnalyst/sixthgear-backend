import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /store/marketing/validate-preview
 * Validate a preview token
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { token } = req.query as { token?: string };

    if (!token) {
      return res.status(400).json({ valid: false, error: "Token is required" });
    }

    // Check in-memory token store
    const tokens = (global as any).__previewTokens || {};
    const tokenData = tokens[token];

    if (tokenData && tokenData.expiresAt > Date.now()) {
      return res.json({
        valid: true,
        itemId: tokenData.itemId,
        redirectPath: tokenData.redirectPath,
      });
    }

    return res.json({ valid: false, error: "Invalid or expired token" });
  } catch (error) {
    console.error("[Marketing] Error validating preview token:", error);
    return res.status(500).json({ valid: false, error: "Validation failed" });
  }
};
