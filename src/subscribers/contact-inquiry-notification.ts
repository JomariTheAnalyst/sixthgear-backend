import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Contact Inquiry Notification Subscriber
 *
 * Sends email notification when a new contact inquiry is created
 * Uses Medusa's notification system (configure email provider in medusa-config.ts)
 */

export default async function contactInquiryNotificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  subject?: string;
  message: string;
}>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  // Note: NOTIFICATION service is deprecated in Medusa v2
  // Email notifications should be handled via workflows
  // Commenting out for now to prevent build errors

  /*
  const notificationService = container.resolve(
    ContainerRegistrationKeys.NOTIFICATION,
  );

  try {
    // Send notification to support team
    await notificationService.createNotifications({
      to: process.env.SUPPORT_EMAIL || "support@sixthgear.com",
      channel: "email",
      template: "contact-inquiry-notification",
      data: {
        inquiry_id: data.id,
        customer_name: `${data.first_name} ${data.last_name}`,
        customer_email: data.email,
        subject: data.subject || "No subject",
        message: data.message,
        admin_url: `${process.env.ADMIN_URL || "http://localhost:9000/app"}/contact-inquiries/${data.id}`,
      },
    });

    logger.info(`Notification sent for contact inquiry: ${data.id}`);
  } catch (error) {
    logger.error("Error sending contact inquiry notification:", error);
    // Don't throw - we don't want to fail the inquiry creation if email fails
  }
  */

  logger.info(
    `Contact inquiry created: ${data.id} - Notifications disabled (Medusa v2)`,
  );
}

export const config: SubscriberConfig = {
  event: "contact_inquiry.created",
};
