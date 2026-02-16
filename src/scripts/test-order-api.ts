import { MedusaContainer } from "@medusajs/framework/types";

export default async function testOrderAPI({
  container,
}: {
  container: MedusaContainer;
}) {
  const orderId = "order_01KHJK69GHG9Z8JG7VR10QSV31";

  console.log("=== Testing Order API Response ===");
  console.log("Order ID:", orderId);

  // Simulate what the frontend API call does
  const query = container.resolve("query");

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "total",
      "subtotal",
      "shipping_total",
      "tax_total",
      "discount_total",
      "currency_code",
      "created_at",
      "items.*",
      "items.title",
      "items.quantity",
      "items.total",
      "items.variant.*",
      "items.product.*",
      "payment_collections.*",
      "payment_collections.payment_sessions.*",
    ],
    filters: { id: orderId },
  });

  if (!orders || orders.length === 0) {
    console.log("Order not found!");
    return;
  }

  const order = orders[0];

  console.log("\n=== Order Response ===");
  console.log("ID:", order.id);
  console.log("Display ID:", order.display_id);
  console.log("Total:", order.total);
  console.log("Subtotal:", order.subtotal);
  console.log("Shipping Total:", order.shipping_total);
  console.log("Tax Total:", order.tax_total);

  console.log("\n=== Items ===");
  console.log("Items array:", order.items);
  console.log("Items length:", order.items?.length);
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      console.log(`\nItem ${index + 1}:`);
      console.log("  Title:", item.title);
      console.log("  Quantity:", item.quantity);
      console.log("  Total:", item.total);
    });
  }

  console.log("\n=== Payment Collections ===");
  console.log("Payment collections:", order.payment_collections);
  if (order.payment_collections && order.payment_collections.length > 0) {
    const pc = order.payment_collections[0];
    console.log("Payment collection ID:", pc.id);
    console.log("Payment sessions:", pc.payment_sessions);
    if (pc.payment_sessions && pc.payment_sessions.length > 0) {
      const ps = pc.payment_sessions[0];
      console.log("Provider ID:", ps.provider_id);
    }
  }

  console.log("\n=== Serialized JSON (what frontend receives) ===");
  const serialized = JSON.stringify(order);
  console.log("Serialized length:", serialized.length);
  const parsed = JSON.parse(serialized);
  console.log("Parsed items:", parsed.items);
  console.log("Parsed items length:", parsed.items?.length);
  console.log("Parsed shipping_total:", parsed.shipping_total);
  console.log(
    "Parsed payment provider:",
    parsed.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id,
  );
}
