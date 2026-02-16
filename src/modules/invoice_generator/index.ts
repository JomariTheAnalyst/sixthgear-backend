import { Module } from "@medusajs/framework/utils";
import InvoiceGeneratorService from "./service";

export const INVOICE_MODULE = "invoice_generator";

/**
 * Invoice Generator Module
 *
 * Handles PDF invoice generation for orders
 */
export default Module(INVOICE_MODULE, {
  service: InvoiceGeneratorService,
});
