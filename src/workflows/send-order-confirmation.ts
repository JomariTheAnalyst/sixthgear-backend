import {
  createWorkflow,
  when,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";
import { Modules } from "@medusajs/framework/utils";
import { generateOrderNumber } from "../utils/generate-order-number";

type WorkflowInput = {
  id: string;
};

/**
 * Step to ensure custom order number is set
 * This prevents race condition with set-custom-order-number subscriber
 */
const ensureCustomOrderNumberStep = createStep(
  "ensure-custom-order-number",
  async ({ orderId }: { orderId: string }, { container }) => {
    const query = container.resolve("query");

    // Fetch order to check if custom_display_id is set
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "custom_display_id"],
      filters: { id: orderId },
    });

    const order = orders[0];
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // If already set, return it
    if (order.custom_display_id) {
      console.log(
        "[Email Workflow] Custom order number already set:",
        order.custom_display_id,
      );
      return new StepResponse({ customOrderNumber: order.custom_display_id });
    }

    // Generate and set custom order number
    const customOrderNumber = generateOrderNumber(order.display_id);

    console.log("[Email Workflow] Setting custom order number:", {
      order_id: order.id,
      display_id: order.display_id,
      custom_display_id: customOrderNumber,
    });

    const orderModuleService = container.resolve(Modules.ORDER);

    await orderModuleService.updateOrders({
      id: order.id,
      custom_display_id: customOrderNumber,
    });

    console.log(
      "[Email Workflow] ✅ Custom order number set:",
      customOrderNumber,
    );

    return new StepResponse({ customOrderNumber });
  },
);

/**
 * Send Order Confirmation Workflow
 *
 * Sends an order confirmation email when an order is placed.
 *
 * Steps:
 * 1. Ensure custom order number is set (prevents race condition)
 * 2. Fetch order details with customer and items
 * 3. Check if order has an email address
 * 4. Send order confirmation email via Resend
 *
 * @param id - Order ID
 * @returns Notification result
 */
export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    // Step 1: Ensure custom order number is set before sending email
    ensureCustomOrderNumberStep({ orderId: id });

    // Step 2: Fetch order with all necessary details
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "custom_display_id",
        "email",
        "currency_code",
        "created_at",
        "total",
        "subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "item_subtotal",
        "item_total",
        "item_tax_total",
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "customer.*",
        "payment_collections.*",
        "payment_collections.payments.*",
      ],
      filters: {
        id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    });

    // Step 3: Only send email if order has an email address
    const notification = when(
      { orders },
      (data) => !!data.orders[0].email,
    ).then(() => {
      return sendNotificationStep([
        {
          to: orders[0].email!,
          channel: "email",
          template: "order-placed",
          data: {
            order: orders[0],
          },
        },
      ]);
    });

    return new WorkflowResponse({
      notification,
    });
  },
);
