/**
 * Type definitions for Contact Inquiry module
 */

export type ContactInquiryStatus =
  | "new"
  | "in_progress"
  | "resolved"
  | "closed";

export interface CreateContactInquiryDTO {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  subscribed_to_newsletter?: boolean;
  ip_address?: string;
  user_agent?: string;
}

export interface UpdateContactInquiryDTO {
  status?: ContactInquiryStatus;
  assigned_to?: string;
  internal_notes?: string;
  resolved_at?: Date;
}

export interface ContactInquiryFilters {
  status?: ContactInquiryStatus | ContactInquiryStatus[];
  email?: string;
  assigned_to?: string;
  created_at?: {
    $gte?: Date;
    $lte?: Date;
  };
}
