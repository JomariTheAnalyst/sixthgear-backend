import { MedusaService } from "@medusajs/framework/utils";
import Invoice from "./models/invoice";
import InvoiceConfig from "./models/invoice-config";

/**
 * Invoice Generator Service
 *
 * Handles invoice generation, storage, and retrieval
 */
class InvoiceGeneratorService extends MedusaService({
  Invoice,
  InvoiceConfig,
}) {
  /**
   * Generate next invoice number (10 digits)
   * Format: 0000000001, 0000000002, etc.
   */
  async generateInvoiceNumber(): Promise<string> {
    const config = await this.getOrCreateConfig();
    const invoiceNumber = config.next_invoice_number
      .toString()
      .padStart(10, "0");

    // Increment for next invoice
    await this.updateConfig({
      next_invoice_number: config.next_invoice_number + 1,
    });

    return invoiceNumber;
  }

  /**
   * Get or create default invoice configuration
   */
  async getOrCreateConfig() {
    const configs = await this.listInvoiceConfigs();

    if (configs.length > 0) {
      return configs[0];
    }

    // Create default config
    return await this.createInvoiceConfigs({
      company_name: process.env.INVOICE_COMPANY_NAME || "SixthGear Coffee",
      company_address: process.env.INVOICE_COMPANY_ADDRESS || "",
      company_phone: process.env.INVOICE_COMPANY_PHONE || "",
      company_email: process.env.INVOICE_COMPANY_EMAIL || "",
      company_logo_url: process.env.INVOICE_LOGO_URL || "",
      tax_id: process.env.INVOICE_TAX_ID || "",
      invoice_prefix: "INV",
      next_invoice_number: 1,
      invoice_notes:
        process.env.INVOICE_NOTES || "Thank you for your business!",
    });
  }

  /**
   * Update invoice configuration
   */
  async updateConfig(data: Partial<any>) {
    const config = await this.getOrCreateConfig();
    const updated = await this.updateInvoiceConfigs({ id: config.id }, data);
    return Array.isArray(updated) ? updated[0] : updated;
  }

  /**
   * Get invoice by order ID
   */
  async getInvoiceByOrderId(orderId: string) {
    const invoices = await this.listInvoices({
      filters: { order_id: orderId, is_stale: false },
    });

    return invoices.length > 0 ? invoices[0] : null;
  }

  /**
   * Mark existing invoices as stale (when order is updated)
   */
  async markInvoicesAsStale(orderId: string) {
    const invoices = await this.listInvoices({
      filters: { order_id: orderId, is_stale: false },
    });

    for (const invoice of invoices) {
      await this.updateInvoices(
        { id: invoice.id },
        {
          is_stale: true,
          status: "stale",
        },
      );
    }
  }
}

export default InvoiceGeneratorService;
