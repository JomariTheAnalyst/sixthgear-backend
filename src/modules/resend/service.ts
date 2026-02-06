import { AbstractNotificationProviderService } from "@medusajs/framework/utils";
import { Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { Resend } from "resend";
import {
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import { CreateEmailOptions } from "resend";

// Email template types
enum Templates {
  ORDER_PLACED = "order-placed",
  ORDER_SHIPPED = "order-shipped",
  ORDER_DELIVERED = "order-delivered",
  CUSTOMER_CREATED = "customer-created",
  PASSWORD_RESET = "password-reset",
  CONTACT_INQUIRY_RECEIVED = "contact-inquiry-received",
}

// Template registry - maps template types to React components or HTML strings
const templates: Record<Templates, any> = {
  [Templates.ORDER_PLACED]: null, // Will be set after importing the template
  [Templates.ORDER_SHIPPED]: null,
  [Templates.ORDER_DELIVERED]: null,
  [Templates.CUSTOMER_CREATED]: null,
  [Templates.PASSWORD_RESET]: null,
  [Templates.CONTACT_INQUIRY_RECEIVED]: null,
};

type ResendModuleOptions = {
  api_key: string;
  from: string;
  orders_from?: string; // Optional: dedicated sender for order emails
};

/**
 * Resend Notification Provider Service
 *
 * Implements email notifications using Resend API.
 * Follows Medusa's Notification Module Provider pattern.
 */
export default class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend";

  protected resendClient: Resend;
  protected logger: Logger;
  protected options: ResendModuleOptions;

  constructor({ logger }: { logger: Logger }, options: ResendModuleOptions) {
    super();

    this.logger = logger;
    this.options = options;

    // Initialize Resend client with API key
    this.resendClient = new Resend(options.api_key);
  }

  /**
   * Validate module options
   * Ensures required configuration is provided
   */
  static validateOptions(options: ResendModuleOptions) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend API key is required in module options",
      );
    }

    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend 'from' email address is required in module options",
      );
    }
  }

  /**
   * Get email template for a given template type
   */
  protected getTemplate(templateType: Templates) {
    return templates[templateType];
  }

  /**
   * Get email subject for a given template type
   */
  protected getTemplateSubject(templateType: Templates): string {
    const subjects: Record<Templates, string> = {
      [Templates.ORDER_PLACED]: "Order Confirmation - SixthGear",
      [Templates.ORDER_SHIPPED]: "Your Order Has Shipped - SixthGear",
      [Templates.ORDER_DELIVERED]: "Your Order Has Been Delivered - SixthGear",
      [Templates.CUSTOMER_CREATED]: "Welcome to SixthGear!",
      [Templates.PASSWORD_RESET]: "Reset Your Password - SixthGear",
      [Templates.CONTACT_INQUIRY_RECEIVED]:
        "We Received Your Message - SixthGear",
    };

    return subjects[templateType] || "Notification from SixthGear";
  }

  /**
   * Get sender email address for a given template type
   * Uses dedicated sender addresses for different email purposes
   */
  protected getSenderEmail(templateType: Templates): string {
    // Order-related emails use dedicated orders@ sender if configured
    if (templateType === Templates.ORDER_PLACED && this.options.orders_from) {
      return this.options.orders_from;
    }

    // All other emails use default sender
    return this.options.from;
  }

  /**
   * Send email notification
   *
   * @param notification - Notification details including recipient, template, and data
   * @returns Result with email ID if successful
   */
  async send(
    notification: ProviderSendNotificationDTO,
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates);

    if (!template) {
      this.logger.error(
        `Couldn't find an email template for ${notification.template}. ` +
          `Valid options are: ${Object.values(Templates).join(", ")}`,
      );
      return {};
    }

    // Prepare common email options with appropriate sender
    const commonOptions = {
      from: this.getSenderEmail(notification.template as Templates),
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
    };

    // Determine if template is HTML string or React component
    let emailOptions: CreateEmailOptions;
    if (typeof template === "string") {
      // HTML template
      emailOptions = {
        ...commonOptions,
        html: template,
      };
    } else {
      // React template
      emailOptions = {
        ...commonOptions,
        react: template(notification.data),
      };
    }

    try {
      // Send email via Resend
      const { data, error } = await this.resendClient.emails.send(emailOptions);

      if (error || !data) {
        if (error) {
          this.logger.error("Failed to send email via Resend", error);
        } else {
          this.logger.error("Failed to send email via Resend: unknown error");
        }
        return {};
      }

      this.logger.info(`Email sent successfully via Resend: ${data.id}`);
      return { id: data.id };
    } catch (error) {
      this.logger.error("Exception while sending email via Resend", error);
      return {};
    }
  }
}

// Import and register templates
// This is done after the class definition to avoid circular dependencies
import { orderPlacedEmail } from "./emails/order-placed";
import { orderShippedEmail } from "./emails/order-shipped";
import { orderDeliveredEmail } from "./emails/order-delivered";
import { passwordResetEmail } from "./emails/password-reset";

templates[Templates.ORDER_PLACED] = orderPlacedEmail;
templates[Templates.ORDER_SHIPPED] = orderShippedEmail;
templates[Templates.ORDER_DELIVERED] = orderDeliveredEmail;
templates[Templates.PASSWORD_RESET] = passwordResetEmail;
