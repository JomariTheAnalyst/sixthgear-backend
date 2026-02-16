import { MedusaContainer } from "@medusajs/framework/types";

export default async function debugOrderStructure({
  container,
}: {
  container: MedusaContainer;
}) {
  const query = container.resolve("query");

  console.log("=== Debugging Order Structure ===");

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
      "created_at",
      "items.*",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.subtotal",
      "items.total",
      "items.variant.*",
      "items.product.*",
      "payment_collections.*",
      "payment_collections.payment_sessions.*",
      "payment_collections.payment_sessions.provider_id",
      "metadata",
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

  console.log("\n=== Order Basic Info ===");
  console.log("Order ID:", order.id);
  console.log("Display ID:", order.display_id);
  console.log("Total:", order.total);
  console.log("Subtotal:", order.subtotal);
  console.log("Shipping Total:", order.shipping_total);
  console.log("Tax Total:", order.tax_total);

  console.log("\n=== Order Items ===");
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      console.log(`\nItem ${index + 1}:`);
      console.log("  ID:", item.id);
      console.log("  Title:", item.title);
      console.log("  Quantity:", item.quantity);
      console.log("  Unit Price:", item.unit_price);
      console.log("  Total:", item.total);
      console.log("  Variant:", item.variant);
      console.log("  Product:", item.product);
    });
  } else {
    console.log("No items found!");
  }

  console.log("\n=== Payment Collections ===");
  if (order.payment_collections && order.payment_collections.length > 0) {
    order.payment_collections.forEach((pc: any, index: number) => {
      console.log(`\nPayment Collection ${index + 1}:`);
      console.log("  ID:", pc.id);
      console.log("  Status:", pc.status);
      if (pc.payment_sessions && pc.payment_sessions.length > 0) {
        pc.payment_sessions.forEach((ps: any, psIndex: number) => {
          console.log(`  Payment Session ${psIndex + 1}:`);
          console.log("    ID:", ps.id);
          console.log("    Provider ID:", ps.provider_id);
          console.log("    Status:", ps.status);
        });
      }
    });
  } else {
    console.log("No payment collections found!");
  }

  console.log("\n=== Metadata ===");
  console.log(JSON.stringify(order.metadata, null, 2));

  console.log("\n=== Full Order Object (JSON) ===");
  console.log(JSON.stringify(order, null, 2));
}
