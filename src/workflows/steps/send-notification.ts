import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export type SendNotificationStepInput = {
  to: string;
  channel: string;
  template: string;
  data?: Record<string, any>;
}[];

/**
 * Send Notification Step
 *
 * Sends notifications using the Notification Module.
 * Can send multiple notifications in a single step.
 *
 * @param notifications - Array of notifications to send
 * @returns Array of created notification IDs
 */
export const sendNotificationStep = createStep(
  "send-notification-step",
  async (notifications: SendNotificationStepInput, { container }) => {
    const notificationModuleService: INotificationModuleService =
      container.resolve(Modules.NOTIFICATION);

    const createdNotifications =
      await notificationModuleService.createNotifications(notifications);

    return new StepResponse(createdNotifications);
  },
);
