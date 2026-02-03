import { MedusaService } from "@medusajs/framework/utils";
import ContactInquiry from "./models/contact-inquiry";

/**
 * Contact Inquiry Service
 * Handles all business logic for contact inquiries
 */
class ContactInquiryModuleService extends MedusaService({
  ContactInquiry,
}) {}

export default ContactInquiryModuleService;
