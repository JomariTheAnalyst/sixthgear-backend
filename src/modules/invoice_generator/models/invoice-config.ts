import { model } from "@medusajs/framework/utils";

/**
 * Invoice Configuration Model
 *
 * Stores company information for invoice generation
 * Only one record should exist (singleton pattern)
 */
const InvoiceConfig = model.define("invoice_config", {
  id: model.id().primaryKey(),
  company_name: model.text().default("SixthGear Coffee"),
  company_address: model.text().nullable(),
  company_phone: model.text().nullable(),
  company_email: model.text().nullable(),
  company_logo_url: model.text().nullable(),
  tax_id: model.text().nullable(),
  invoice_prefix: model.text().default("INV"),
  next_invoice_number: model.number().default(1),
  invoice_notes: model.text().nullable(),
});

export default InvoiceConfig;
