import { model } from "@medusajs/framework/utils";

/**
 * Contact Inquiry Model
 * Stores customer inquiries submitted via the Contact Us form
 */
const ContactInquiry = model.define("contact_inquiry", {
  id: model.id().primaryKey(),

  // Customer Information
  first_name: model.text(),
  last_name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),

  // Inquiry Details
  subject: model.text().nullable(),
  message: model.text(),

  // Status Management
  status: model
    .enum(["new", "in_progress", "resolved", "closed"])
    .default("new"),

  // Admin Operations
  assigned_to: model.text().nullable(), // Admin user ID
  internal_notes: model.text().nullable(),

  // Marketing
  subscribed_to_newsletter: model.boolean().default(false),

  // Metadata
  ip_address: model.text().nullable(),
  user_agent: model.text().nullable(),

  // Timestamps (created_at and updated_at are automatically added by Medusa)
  resolved_at: model.dateTime().nullable(),
});

export default ContactInquiry;
