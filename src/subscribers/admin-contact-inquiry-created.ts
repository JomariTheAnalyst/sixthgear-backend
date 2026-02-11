import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Admin Contact Inquiry Notification Subscriber
 *
 * Sends a notification to the admin panel when a new contact inquiry is submitted.
 *
 * Event: contact_inquiry.created
 * Channel: feed (admin panel)
 * Provider: local
 *
 * Notification Details:
 * - Shows customer name and email
 * - Shows inquiry subject
 * - Links to inquiry details
 * - Medium priority notification
 */
export default async function adminContactInquiryCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(
    "🔔 [Admin Notification] Contact inquiry event received:",
    data.id,
  );

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  // Fetch contact inquiry details
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: inquiries } = await query.graph({
    entity: "contact_inquiry",
    fields: ["id", "first_name", "last_name", "email", "subject", "message"],
    filters: { id: data.id },
  });

  const inquiry = inquiries[0];
  if (!inquiry) {
    console.error(
      "❌ [Admin Notification] Contact inquiry not found:",
      data.id,
    );
    return;
  }

  console.log("📧 [Admin Notification] Contact inquiry details:", {
    id: inquiry.id,
    name: `${inquiry.first_name} ${inquiry.last_name}`,
    email: inquiry.email,
    subject: inquiry.subject,
  });

  // Build customer name
  const customerName = `${inquiry.first_name} ${inquiry.last_name}`.trim();

  // Truncate message for preview (max 100 chars)
  const messagePreview =
    inquiry.message.length > 100
      ? `${inquiry.message.substring(0, 100)}...`
      : inquiry.message;

  // Send notification to admin panel
  try {
    await notificationModuleService.createNotifications({
      to: "admin",
      channel: "feed",
      template: "contact-inquiry-admin",
      data: {
        title: `New Contact Inquiry from ${customerName}`,
        description: inquiry.subject
          ? `Subject: ${inquiry.subject} • ${messagePreview}`
          : messagePreview,
        resource_id: inquiry.id,
        resource_type: "contact_inquiry",
      },
    });
    console.log("✅ [Admin Notification] Notification sent successfully");
  } catch (error) {
    console.error(
      "❌ [Admin Notification] Failed to send notification:",
      error,
    );
  }
}

export const config: SubscriberConfig = {
  event: "contact_inquiry.created",
};
