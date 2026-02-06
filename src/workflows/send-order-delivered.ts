import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

type OrderDeliveredWorkflowInput = {
  order_id: string;
  delivered_date?: Date;
};

/**
 * Send Order Delivered Notification Step
 */
const sendOrderDeliveredNotificationStep = createStep(
  "send-order-delivered-notification",
  async (
    input: {
      order: any;
      delivered_date?: Date;
    },
    { container },
  ) => {
    const notificationModuleService: any = container.resolve("notification");

    // Send notification
    await notificationModuleService.createNotifications({
      to: input.order.email,
      channel: "email",
      template: "order-delivered",
      data: {
        order: input.order,
        delivered_date: input.delivered_date || new Date(),
      },
    });

    return new StepResponse({ success: true });
  },
);

/**
 * Order Delivered Notification Workflow
 *
 * Sends an email notification when an order has been delivered.
 * Includes delivery confirmation and feedback request.
 *
 * Triggered by: Manual API call or admin action
 * Template: order-delivered
 */
export const sendOrderDeliveredWorkflow = createWorkflow(
  "send-order-delivered",
  (input: OrderDeliveredWorkflowInput) => {
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
      return sendOrderDeliveredNotificationStep({
        order: orders[0],
        delivered_date: input.delivered_date,
      });
    });

    return new WorkflowResponse({
      notification,
    });
  },
);
