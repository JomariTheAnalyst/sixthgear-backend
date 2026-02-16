import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { generateInvoiceWorkflow } from "../workflows/generate-invoice";

/**
 * Invoice Generator Subscriber
 *
 * Automatically generates invoices when orders are placed
 */
export default async function invoiceGeneratorHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderId = data.id;

    console.log(
      `[Invoice Subscriber] Order placed: ${orderId}, generating invoice...`,
    );

    // Run invoice generation workflow
    const { result } = await generateInvoiceWorkflow(container).run({
      input: { orderId },
    });

    console.log(
      `[Invoice Subscriber] Invoice generated successfully: ${result.invoice.invoice_number}`,
    );
  } catch (error: any) {
    console.error("[Invoice Subscriber] Error generating invoice:", error);
    // Don't throw - we don't want to fail the order if invoice generation fails
    // Invoice can be generated later on-demand
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
