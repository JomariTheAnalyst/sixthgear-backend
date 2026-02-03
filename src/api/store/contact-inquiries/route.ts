import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CONTACT_INQUIRY_MODULE } from "../../../modules/contact-inquiry";

/**
 * Store API: Submit Contact Inquiry
 * POST /store/contact-inquiries
 *
 * Public endpoint for submitting contact form inquiries
 * Includes basic rate limiting and validation
 */

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }

  if (limit.count >= 5) {
    // Max 5 submissions per minute
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  try {
    const contactInquiryService = req.scope.resolve(CONTACT_INQUIRY_MODULE);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

    // Get client IP
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    // Rate limiting
    if (!checkRateLimit(ip)) {
      res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
      return;
    }

    // Validate required fields
    const body = req.body as {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
      subscribed_to_newsletter?: boolean;
    };
    const { first_name, last_name, email, message } = body;

    if (!first_name || !last_name || !email || !message) {
      res.status(400).json({
        message:
          "Missing required fields: first_name, last_name, email, message",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        message: "Invalid email address",
      });
      return;
    }

    // Sanitize and validate message length
    if (message.length < 10) {
      res.status(400).json({
        message: "Message must be at least 10 characters",
      });
      return;
    }

    if (message.length > 5000) {
      res.status(400).json({
        message: "Message is too long (max 5000 characters)",
      });
      return;
    }

    // Create inquiry
    const inquiry = await contactInquiryService.createContactInquiries({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      subject: body.subject?.trim() || null,
      message: message.trim(),
      subscribed_to_newsletter: body.subscribed_to_newsletter || false,
      ip_address: ip,
      user_agent: req.headers["user-agent"] || null,
    });

    logger.info(`Contact inquiry created: ${inquiry.id} from ${email}`);

    // Note: Event emission removed as EVENT_BUS is deprecated in Medusa v2
    // Email notifications should be handled via workflows or subscribers

    res.status(201).json({
      message:
        "Your inquiry has been submitted successfully. We'll get back to you soon!",
      inquiry: {
        id: inquiry.id,
        created_at: inquiry.created_at,
      },
    });
  } catch (error) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    logger.error("Error creating contact inquiry:", error);

    res.status(500).json({
      message:
        "An error occurred while submitting your inquiry. Please try again.",
    });
  }
}
