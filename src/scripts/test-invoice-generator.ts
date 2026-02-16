import { Modules } from "@medusajs/framework/utils";

/**
 * Test Invoice Generator Module
 *
 * Tests the invoice generator module setup and configuration
 */
export default async function testInvoiceGenerator({ container }: any) {
  console.log("\n=== Testing Invoice Generator Module ===\n");

  try {
    // 1. Test module resolution
    console.log("1. Testing module resolution...");
    const invoiceService = container.resolve("invoice_generator");
    console.log("✓ Invoice service resolved successfully");

    // 2. Test config creation
    console.log("\n2. Testing invoice configuration...");
    const config = await invoiceService.getOrCreateConfig();
    console.log("✓ Invoice config:", {
      company_name: config.company_name,
      invoice_prefix: config.invoice_prefix,
      next_invoice_number: config.next_invoice_number,
    });

    // 3. Test invoice number generation
    console.log("\n3. Testing invoice number generation...");
    const invoiceNumber1 = await invoiceService.generateInvoiceNumber();
    const invoiceNumber2 = await invoiceService.generateInvoiceNumber();
    console.log("✓ Generated invoice numbers:", invoiceNumber1, invoiceNumber2);

    // 4. List existing orders
    console.log("\n4. Checking for existing orders...");
    const orderModuleService = container.resolve(Modules.ORDER);
    const orders = await orderModuleService.listOrders({}, { take: 5 });

    if (orders.length === 0) {
      console.log(
        "⚠ No orders found. Create an order to test invoice generation.",
      );
    } else {
      console.log(`✓ Found ${orders.length} orders`);
      orders.forEach((order: any) => {
        console.log(
          `  - Order ${order.display_id || order.id}: ${order.email}`,
        );
      });
    }

    // 5. Check existing invoices
    console.log("\n5. Checking existing invoices...");
    const invoices = await invoiceService.listInvoices();
    console.log(`✓ Found ${invoices.length} invoices`);

    if (invoices.length > 0) {
      invoices.forEach((invoice: any) => {
        console.log(
          `  - Invoice ${invoice.invoice_number}: Order ${invoice.order_id} (${invoice.status})`,
        );
      });
    }

    console.log("\n=== Invoice Generator Module Test Complete ===\n");
    console.log("✓ All tests passed!");
    console.log("\nNext steps:");
    console.log(
      "1. Place a test order to trigger automatic invoice generation",
    );
    console.log(
      "2. Check the invoice via API: GET /store/orders/{order_id}/invoice",
    );
    console.log(
      "3. Download invoice: GET /store/orders/{order_id}/invoice/download",
    );
  } catch (error: any) {
    console.error("\n✗ Test failed:", error.message);
    console.error(error);
    throw error;
  }
}
