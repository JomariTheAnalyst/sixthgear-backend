import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

type PasswordResetWorkflowInput = {
  email: string;
  token: string;
  customer_name?: string;
};

/**
 * Send Password Reset Notification Step
 *
 * Sends password reset email with secure token link.
 */
const sendPasswordResetNotificationStep = createStep(
  "send-password-reset-notification",
  async (input: PasswordResetWorkflowInput, { container }) => {
    const notificationModuleService: any = container.resolve("notification");

    // Construct reset URL
    const resetUrl = `${process.env.STOREFRONT_URL || "http://localhost:8000"}/reset-password?token=${input.token}`;

    // Send notification
    await notificationModuleService.createNotifications({
      to: input.email,
      channel: "email",
      template: "password-reset",
      data: {
        resetToken: input.token,
        resetUrl: resetUrl,
        customerName: input.customer_name,
      },
    });

    return new StepResponse({ success: true });
  },
);

/**
 * Password Reset Notification Workflow
 *
 * Sends an email with a secure link to reset password.
 * Link expires in 1 hour for security.
 *
 * Triggered by: auth.password_reset event or API call
 * Template: password-reset
 */
export const sendPasswordResetWorkflow = createWorkflow(
  "send-password-reset",
  (input: PasswordResetWorkflowInput) => {
    const result = sendPasswordResetNotificationStep(input);

    return new WorkflowResponse(result);
  },
);
