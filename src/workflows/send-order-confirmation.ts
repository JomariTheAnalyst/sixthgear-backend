import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
  id: string;
};

/**
 * Send Order Confirmation Workflow
 *
 * Sends an order confirmation email when an order is placed.
 *
 * Steps:
 * 1. Fetch order details with customer and items
 * 2. Check if order has an email address
 * 3. Send order confirmation email via Resend
 *
 * @param id - Order ID
 * @returns Notification result
 */
export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    // Fetch order with all necessary details
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
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

    // Only send email if order has an email address
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
