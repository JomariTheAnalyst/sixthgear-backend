import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

type OrderShippedWorkflowInput = {
  order_id: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
};

/**
 * Send Order Shipped Notification Step
 */
const sendOrderShippedNotificationStep = createStep(
  "send-order-shipped-notification",
  async (
    input: {
      order: any;
      tracking_number?: string;
      tracking_url?: string;
      carrier?: string;
    },
    { container },
  ) => {
    const notificationModuleService: any = container.resolve("notification");

    // Send notification
    await notificationModuleService.createNotifications({
      to: input.order.email,
      channel: "email",
      template: "order-shipped",
      data: {
        order: input.order,
        tracking_number: input.tracking_number,
        tracking_url: input.tracking_url,
        carrier: input.carrier,
      },
    });

    return new StepResponse({ success: true });
  },
);

/**
 * Order Shipped Notification Workflow
 *
 * Sends an email notification when an order has been shipped.
 * Includes tracking information if available.
 *
 * Triggered by: order.fulfillment_created event or manual API call
 * Template: order-shipped
 */
export const sendOrderShippedWorkflow = createWorkflow(
  "send-order-shipped",
  (input: OrderShippedWorkflowInput) => {
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
      ],
      filters: {
        id: input.order_id,
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
      return sendOrderShippedNotificationStep({
        order: orders[0],
        tracking_number: input.tracking_number,
        tracking_url: input.tracking_url,
        carrier: input.carrier,
      });
    });

    return new WorkflowResponse({
      notification,
    });
  },
);
