import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CONTACT_INQUIRY_MODULE } from "../../../modules/contact-inquiry";

/**
 * Admin API: List Contact Inquiries
 * GET /admin/contact-inquiries
 *
 * Returns paginated list of contact inquiries with filtering
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const contactInquiryService = req.scope.resolve(CONTACT_INQUIRY_MODULE);

  const {
    status,
    email,
    limit = 20,
    offset = 0,
    order = "-created_at",
  } = req.query;

  const filters: any = {};

  if (status) {
    filters.status = Array.isArray(status) ? status : [status];
  }

  if (email) {
    filters.email = email;
  }

  const [inquiries, count] =
    await contactInquiryService.listAndCountContactInquiries(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: order === "-created_at" ? "DESC" : "ASC" },
    });

  res.json({
    inquiries,
    count,
    limit: Number(limit),
    offset: Number(offset),
  });
}
