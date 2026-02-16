import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { INVOICE_MODULE } from "../../modules/invoice_generator";

type StepInput = {
  order_id: string;
};

export const getOrderInvoiceStep = createStep(
  "get-order-invoice",
  async ({ order_id }: StepInput, { container }) => {
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE);
    let [invoice] = await invoiceGeneratorService.listInvoices({
      order_id,
      status: "pending",
    });
    let createdInvoice = false;

    if (!invoice) {
      // Get the count of existing invoices to generate the next invoice number
      const [, count] = await invoiceGeneratorService.listAndCountInvoices();
      const invoiceNumber = `INV-${String(count + 1).padStart(10, "0")}`;

      // Store new invoice in database
      invoice = await invoiceGeneratorService.createInvoices({
        order_id,
        invoice_number: invoiceNumber,
        status: "pending",
        pdfContent: {},
      });
      createdInvoice = true;
    }

    return new StepResponse(invoice, {
      created_invoice: createdInvoice,
      invoice_id: invoice.id,
    });
  },
  async (data, { container }) => {
    const { created_invoice, invoice_id } = data || {};
    if (!created_invoice || !invoice_id) {
      return;
    }
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE);

    invoiceGeneratorService.deleteInvoices(invoice_id);
  },
);
