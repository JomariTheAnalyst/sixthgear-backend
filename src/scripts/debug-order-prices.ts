import { MedusaContainer } from "@medusajs/framework/types";

export default async function debugOrderPrices({
  container,
}: {
  container: MedusaContainer;
}) {
  const query = container.resolve("query");

  console.log("=== Debugging Order Prices ===");

  // Get the most recent order
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "total",
      "subtotal",
      "tax_total",
      "shipping_total",
      "currency_code",
      "items.*",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.subtotal",
      "items.total",
    ],
    pagination: {
      take: 1,
      order: { created_at: "DESC" },
    },
  });

  if (!orders || orders.length === 0) {
    console.log("No orders found");
    return;
  }

  const order = orders[0];

  console.log("\n=== Order Details ===");
  console.log("Order ID:", order.id);
  console.log("Display ID:", order.display_id);
  console.log("Currency:", order.currency_code);
  console.log("\n=== Raw Values ===");
  console.log("Total:", order.total);
  console.log("Subtotal:", order.subtotal);
  console.log("Shipping:", order.shipping_total);
  console.log("Tax:", order.tax_total);

  console.log("\n=== Items ===");
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      console.log(`\nItem ${index + 1}:`);
      console.log("  Title:", item.title);
      console.log("  Quantity:", item.quantity);
      console.log("  Unit Price (raw):", item.unit_price);
      console.log("  Subtotal (raw):", item.subtotal);
      console.log("  Total (raw):", item.total);
    });
  }

  console.log("\n=== Analysis ===");
  console.log("If prices are in cents, divide by 100");
  console.log("If prices are in dollars/pesos, use as-is");
  console.log(
    `Example: ${order.total} / 100 = ${order.total / 100} OR ${order.total} as-is`,
  );
}
