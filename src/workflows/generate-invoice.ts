import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import {
  generateInvoiceDocDefinition,
  generatePdfBuffer,
} from "../modules/invoice_generator/utils/pdf-generator";

/**
 * Step 1: Fetch order details
 */
const fetchOrderStep = createStep(
  "fetch-order-step",
  async ({ orderId }: { orderId: string }, { container }) => {
    const orderModuleService = container.resolve(Modules.ORDER);

    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: [
        "items",
        "items.variant",
        "shipping_address",
        "billing_address",
        "payment_collections",
        "payment_collections.payment_sessions",
      ],
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return new StepResponse({ order });
  },
);

/**
 * Step 2: Generate invoice number and create invoice record
 */
const createInvoiceRecordStep = createStep(
  "create-invoice-record-step",
  async ({ orderId }: { orderId: string }, { container }) => {
    const invoiceService = container.resolve("invoice_generator");

    // Check if invoice already exists
    const existingInvoice = await invoiceService.getInvoiceByOrderId(orderId);
    if (existingInvoice && existingInvoice.status === "generated") {
      return new StepResponse({
        invoice: existingInvoice,
        isNew: false,
      });
    }

    // Mark old invoices as stale
    await invoiceService.markInvoicesAsStale(orderId);

    // Generate new invoice number
    const invoiceNumber = await invoiceService.generateInvoiceNumber();

    // Create invoice record
    const invoice = await invoiceService.createInvoices({
      order_id: orderId,
      invoice_number: invoiceNumber,
      status: "pending",
      is_stale: false,
    });

    return new StepResponse(
      { invoice, isNew: true },
      { invoiceId: invoice.id },
    );
  },
  async ({ invoiceId }, { container }) => {
    if (!invoiceId) return;

    const invoiceService = container.resolve("invoice_generator");

    // Rollback: delete the invoice record
    await invoiceService.deleteInvoices(invoiceId);
  },
);

/**
 * Step 3: Generate PDF
 */
const generatePdfStep = createStep(
  "generate-pdf-step",
  async (
    { order, invoice, config }: { order: any; invoice: any; config: any },
    { container },
  ) => {
    try {
      // Generate PDF document definition
      const docDefinition = generateInvoiceDocDefinition({
        invoiceNumber: invoice.invoice_number,
        order,
        config,
      });

      // Generate PDF buffer
      const pdfBuffer = await generatePdfBuffer(docDefinition);

      return new StepResponse({ pdfBuffer });
    } catch (error: any) {
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  },
);

/**
 * Step 4: Upload PDF to file storage
 */
const uploadPdfStep = createStep(
  "upload-pdf-step",
  async (
    { pdfBuffer, invoice }: { pdfBuffer: Buffer; invoice: any },
    { container },
  ) => {
    try {
      const fileModuleService = container.resolve(Modules.FILE);

      // Create filename
      const filename = `invoice-${invoice.invoice_number}-${Date.now()}.pdf`;

      // Upload to file storage
      const file = await fileModuleService.createFiles({
        filename,
        mimeType: "application/pdf",
        content: pdfBuffer.toString("base64"),
      });

      return new StepResponse({ fileUrl: file.url }, { fileId: file.id });
    } catch (error: any) {
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }
  },
  async ({ fileId }, { container }) => {
    if (!fileId) return;

    const fileModuleService = container.resolve(Modules.FILE);

    // Rollback: delete the uploaded file
    await fileModuleService.deleteFiles(fileId);
  },
);

/**
 * Step 5: Update invoice record with PDF URL
 */
const updateInvoiceRecordStep = createStep(
  "update-invoice-record-step",
  async (
    { invoice, fileUrl }: { invoice: any; fileUrl: string },
    { container },
  ) => {
    const invoiceService = container.resolve("invoice_generator");

    const [updatedInvoice] = await invoiceService.updateInvoices(
      { id: invoice.id },
      {
        pdf_url: fileUrl,
        status: "generated",
        generated_at: new Date(),
      },
    );

    return new StepResponse({ invoice: updatedInvoice });
  },
);

/**
 * Generate Invoice Workflow
 *
 * Orchestrates the complete invoice generation process
 */
export const generateInvoiceWorkflow = createWorkflow(
  "generate-invoice",
  (input: { orderId: string }) => {
    // Step 1: Fetch order
    const { order } = fetchOrderStep(input);

    // Step 2: Create invoice record
    const { invoice, isNew } = createInvoiceRecordStep(input);

    // Get invoice config
    const config = transform({ input }, async ({ input }, { container }) => {
      const invoiceService = container.resolve("invoice_generator");
      return await invoiceService.getOrCreateConfig();
    });

    // Step 3: Generate PDF (only if new invoice)
    const { pdfBuffer } = generatePdfStep({ order, invoice, config });

    // Step 4: Upload PDF
    const { fileUrl } = uploadPdfStep({ pdfBuffer, invoice });

    // Step 5: Update invoice record
    const { invoice: finalInvoice } = updateInvoiceRecordStep({
      invoice,
      fileUrl,
    });

    return new WorkflowResponse({
      invoice: finalInvoice,
      order,
    });
  },
);
