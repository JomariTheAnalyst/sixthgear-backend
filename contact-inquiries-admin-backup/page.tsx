import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading } from "@medusajs/ui";
import { ChatBubbleLeftRight } from "@medusajs/icons";
import { ContactInquiriesTable } from "./components/contact-inquiries-table";

/**
 * Contact Inquiries Admin Page
 *
 * Main page for managing contact form submissions
 */
const ContactInquiriesPage = () => {
  return (
    <Container>
      <div className="flex items-center gap-x-4 mb-6">
        <ChatBubbleLeftRight className="text-ui-fg-subtle" />
        <Heading level="h1">Contact Inquiries</Heading>
      </div>

      <ContactInquiriesTable />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Contact Inquiries",
  icon: ChatBubbleLeftRight,
});

export default ContactInquiriesPage;
