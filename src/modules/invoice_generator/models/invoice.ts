import { model } from "@medusajs/framework/utils";

/**
 * Invoice Model
 *
 * Stores generated invoice records for orders
 */
const Invoice = model.define("invoice", {
  id: model.id().primaryKey(),
  order_id: model.text().searchable(),
  invoice_number: model.text().unique().searchable(),
  pdf_url: model.text().nullable(),
  status: model
    .enum(["pending", "generated", "stale", "failed"])
    .default("pending"),
  generated_at: model.dateTime().nullable(),
  is_stale: model.boolean().default(false),
  error_message: model.text().nullable(),
});

export default Invoice;
