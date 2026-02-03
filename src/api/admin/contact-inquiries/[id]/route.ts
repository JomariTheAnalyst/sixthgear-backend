import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTACT_INQUIRY_MODULE } from "../../../../modules/contact-inquiry";

/**
 * Admin API: Get Single Contact Inquiry
 * GET /admin/contact-inquiries/:id
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const contactInquiryService = req.scope.resolve(CONTACT_INQUIRY_MODULE);
  const { id } = req.params;

  const inquiry = await contactInquiryService.retrieveContactInquiry(id);

  if (!inquiry) {
    res.status(404).json({ message: "Contact inquiry not found" });
    return;
  }

  res.json({ inquiry });
}

/**
 * Admin API: Update Contact Inquiry
 * POST /admin/contact-inquiries/:id
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const contactInquiryService = req.scope.resolve(CONTACT_INQUIRY_MODULE);
  const { id } = req.params;

  const body = req.body as {
    status?: string;
    assigned_to?: string;
    internal_notes?: string;
  };

  const updateData: any = {};

  if (body.status) {
    updateData.status = body.status;

    // Auto-set resolved_at when status changes to resolved
    if (body.status === "resolved" || body.status === "closed") {
      updateData.resolved_at = new Date();
    }
  }

  if (body.assigned_to !== undefined) {
    updateData.assigned_to = body.assigned_to;
  }

  if (body.internal_notes !== undefined) {
    updateData.internal_notes = body.internal_notes;
  }

  const inquiry =
    await contactInquiryService.updateContactInquiries(updateData);

  res.json({ inquiry });
}

/**
 * Admin API: Delete Contact Inquiry
 * DELETE /admin/contact-inquiries/:id
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const contactInquiryService = req.scope.resolve(CONTACT_INQUIRY_MODULE);
  const { id } = req.params;

  await contactInquiryService.deleteContactInquiries(id);

  res.json({ id, deleted: true });
}
