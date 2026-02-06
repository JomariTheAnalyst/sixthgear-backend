// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * POST /auth/customer/emailpass/reset-password
 *
 * Request password reset for a customer.
 * Uses Medusa's built-in password reset functionality.
 *
 * Body:
 * - identifier: string (email address)
 */
export async function POST(
  req: MedusaRequest<{
    identifier: string;
  }>,
  res: MedusaResponse,
) {
  const { identifier: email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    // Use Medusa's built-in password reset
    // This will trigger the password reset email automatically
    const authModule: any = req.scope.resolve("auth");

    await authModule.requestPasswordReset({
      identifier: email,
      provider: "emailpass",
    });

    // Always return success for security (don't reveal if email exists)
    res.json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);

    // Still return success for security
    res.json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  }
}
