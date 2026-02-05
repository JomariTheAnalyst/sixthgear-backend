import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Complete Cart and Create Order from Stripe Checkout Payment
 *
 * This endpoint is called after successful Stripe Checkout payment.
 * It uses Medusa's built-in cart completion API which handles:
 * - Order creation
 * - Payment authorization
 * - Inventory allocation
 * - Cart completion
 *
 * @see https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart
 */

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  console.log("[Complete Cart] ===== CART COMPLETION STARTED =====");

  try {
    const { cart_id, stripe_session_id } = req.body as {
      cart_id: string;
      stripe_session_id: string;
    };

    if (!cart_id) {
      console.error("[Complete Cart] ❌ No cart_id provided");
      res.status(400).json({ error: "cart_id is required" });
      return;
    }

    console.log("[Complete Cart] Completing cart:", {
      cart_id,
      stripe_session_id,
    });

    // Use Medusa's Store API to complete cart
    console.log("[Complete Cart] Using Medusa cart.complete API...");

    const backendUrl =
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
    const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY;

    const completeResponse = await fetch(
      `${backendUrl}/store/carts/${cart_id}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey || "",
        },
      },
    );

    if (!completeResponse.ok) {
      const errorData = await completeResponse.json();
      console.error("[Complete Cart] ❌ Cart completion failed:", errorData);
      throw new Error(errorData.message || "Failed to complete cart");
    }

    const result = await completeResponse.json();

    console.log("[Complete Cart] ✅ Cart completion finished");
    console.log("[Complete Cart] Result type:", result?.type);

    if (result?.type === "order") {
      const order = result.order;
      console.log("[Complete Cart] ✅✅✅ ORDER CREATED:", order.id);

      // Note: Cannot use Next.js revalidateTag in backend API routes
      // Cache revalidation will happen on frontend after redirect
      console.log("[Complete Cart] ✅ Order created successfully");

      res.status(200).json({
        success: true,
        order_id: order.id,
        order: order,
      });
    } else {
      console.error("[Complete Cart] ❌ Cart completion did not create order");
      res.status(500).json({
        error: "Cart completion failed",
        result: result,
      });
    }

    console.log("[Complete Cart] ===== CART COMPLETION COMPLETE =====");
  } catch (error: any) {
    console.error("[Complete Cart] ❌ Error:", error.message);
    console.error("[Complete Cart] Stack:", error.stack);
    res.status(500).json({
      error: error.message || "Failed to complete cart",
      details: error.stack,
    });
  }
}
