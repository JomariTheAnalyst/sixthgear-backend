import { MedusaAppLoader } from "@medusajs/framework";

async function testOrderData() {
  const { container } = await MedusaAppLoader.load(process.cwd());
  const query = container.resolve("query");

  // Get the latest order
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "subtotal",
      "shipping_total",
      "tax_total",
      "item_subtotal",
      "shipping_subtotal",
      "discount_subtotal",
      "payment_status",
      "fulfillment_status",
      "created_at",
      "items.*",
      "items.product_title",
      "items.variant_title",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.original_total",
      "items.thumbnail",
      "payment_collections.*",
      "payment_collections.payments.*",
      "payment_collections.payments.provider_id",
      "payment_collections.payment_sessions.*",
      "payment_collections.payment_sessions.provider_id",
      "shipping_address.*",
      "billing_address.*",
    ],
    filters: {},
  });

  if (!orders || orders.length === 0) {
    console.log("❌ No orders found");
    return;
  }

  const latestOrder = orders[orders.length - 1];

  console.log("\n=== LATEST ORDER DATA ===");
  console.log("Order ID:", latestOrder.id);
  console.log("Display ID:", latestOrder.display_id);
  console.log("Email:", latestOrder.email);
  console.log("\n--- ITEMS ---");
  console.log("Items count:", latestOrder.items?.length || 0);

  if (latestOrder.items && latestOrder.items.length > 0) {
    latestOrder.items.forEach((item: any, index: number) => {
      console.log(`\nItem ${index + 1}:`);
      console.log("  ID:", item.id);
      console.log("  Product Title:", item.product_title);
      console.log("  Variant Title:", item.variant_title);
      console.log("  Quantity:", item.quantity);
      console.log("  Unit Price:", item.unit_price);
      console.log("  Total:", item.total);
      console.log("  Original Total:", item.original_total);
      console.log("  Thumbnail:", item.thumbnail);
    });
  } else {
    console.log("⚠️ No items in order!");
  }

  console.log("\n--- TOTALS ---");
  console.log("Subtotal:", latestOrder.subtotal);
  console.log("Item Subtotal:", latestOrder.item_subtotal);
  console.log("Shipping Total:", latestOrder.shipping_total);
  console.log("Shipping Subtotal:", latestOrder.shipping_subtotal);
  console.log("Tax Total:", latestOrder.tax_total);
  console.log("Discount Subtotal:", latestOrder.discount_subtotal);
  console.log("Total:", latestOrder.total);

  console.log("\n--- PAYMENT INFO ---");
  console.log("Payment Status:", latestOrder.payment_status);
  console.log(
    "Payment Collections:",
    latestOrder.payment_collections?.length || 0,
  );

  if (
    latestOrder.payment_collections &&
    latestOrder.payment_collections.length > 0
  ) {
    const pc = latestOrder.payment_collections[0];
    console.log("\nPayment Collection:");
    console.log("  ID:", pc.id);
    console.log("  Payments:", pc.payments?.length || 0);

    if (pc.payments && pc.payments.length > 0) {
      pc.payments.forEach((payment: any, index: number) => {
        console.log(`\n  Payment ${index + 1}:`);
        console.log("    ID:", payment.id);
        console.log("    Provider ID:", payment.provider_id);
        console.log("    Amount:", payment.amount);
      });
    }

    console.log("\n  Payment Sessions:", pc.payment_sessions?.length || 0);
    if (pc.payment_sessions && pc.payment_sessions.length > 0) {
      pc.payment_sessions.forEach((session: any, index: number) => {
        console.log(`\n  Session ${index + 1}:`);
        console.log("    ID:", session.id);
        console.log("    Provider ID:", session.provider_id);
        console.log("    Status:", session.status);
      });
    }
  }

  console.log("\n--- ADDRESSES ---");
  console.log("Shipping Address:", latestOrder.shipping_address ? "✓" : "✗");
  console.log("Billing Address:", latestOrder.billing_address ? "✓" : "✗");

  console.log("\n=== RAW ORDER OBJECT ===");
  console.log(JSON.stringify(latestOrder, null, 2));

  process.exit(0);
}

testOrderData().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
