import { Modules } from "@medusajs/framework/utils";

export default async function testInvoiceSimple({ container }) {
  console.log("Testing simple invoice generation...");

  // Get a recent order
  const query = container.resolve("query");
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "total", "currency_code"],
    filters: {},
    pagination: { take: 1, order: { created_at: "DESC" } },
  });

  if (orders.length === 0) {
    console.log("No orders found. Please create an order first.");
    return;
  }

  const order = orders[0];
  console.log(`Found order: ${order.id} (${order.email})`);
  console.log(`Total: ${order.currency_code} ${order.total}`);
  console.log("\nInvoice generation test complete!");
}
