import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useParams } from "react-router-dom";
import { Container, Heading } from "@medusajs/ui";
import { ChatBubbleLeftRight } from "@medusajs/icons";
import { ContactInquiryDetail } from "./components/contact-inquiry-detail";

/**
 * Contact Inquiry Detail Page
 *
 * View and manage individual contact inquiry
 */
const ContactInquiryDetailPage = () => {
  const { id } = useParams();

  return (
    <Container>
      <div className="flex items-center gap-x-4 mb-6">
        <ChatBubbleLeftRight className="text-ui-fg-subtle" />
        <Heading level="h1">Contact Inquiry Details</Heading>
      </div>

      {id && <ContactInquiryDetail inquiryId={id} />}
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Contact Inquiry",
});

export default ContactInquiryDetailPage;
