import { MedusaContainer } from "@medusajs/framework/types";

export default async function checkLatestOrder({
  container,
}: {
  container: MedusaContainer;
}) {
  const query = container.resolve("query");

  console.log("=== Checking Latest Order ===");

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
      "items.subtitle",
      "items.quantity",
      "items.unit_price",
      "items.subtotal",
      "items.total",
      "shipping_methods.*",
      "shipping_methods.name",
      "shipping_methods.amount",
      "payment_collections.*",
      "payment_collections.payment_sessions.*",
      "payment_collections.payment_sessions.provider_id",
      "payment_collections.payment_sessions.status",
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

  console.log("\n=== Order ID:", order.id);
  console.log("Display ID:", order.display_id);
  console.log("Total:", JSON.stringify(order.total));
  console.log("Subtotal:", JSON.stringify(order.subtotal));
  console.log("Shipping Total:", JSON.stringify(order.shipping_total));
  console.log("Tax Total:", JSON.stringify(order.tax_total));

  console.log("\n=== Items ===");
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      console.log(`\nItem ${index + 1}:`);
      console.log("  Title:", item.title);
      console.log("  Subtitle:", item.subtitle);
      console.log("  Quantity:", item.quantity);
      console.log("  Unit Price:", JSON.stringify(item.unit_price));
      console.log("  Total:", JSON.stringify(item.total));
    });
  } else {
    console.log("NO ITEMS FOUND!");
  }

  console.log("\n=== Shipping Methods ===");
  if (order.shipping_methods && order.shipping_methods.length > 0) {
    order.shipping_methods.forEach((sm: any, index: number) => {
      console.log(`\nShipping Method ${index + 1}:`);
      console.log("  Name:", sm.name);
      console.log("  Amount:", JSON.stringify(sm.amount));
    });
  } else {
    console.log("NO SHIPPING METHODS FOUND!");
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
          console.log("    Provider ID:", ps.provider_id);
          console.log("    Status:", ps.status);
        });
      }
    });
  } else {
    console.log("NO PAYMENT COLLECTIONS FOUND!");
  }

  console.log("\n=== Full Order JSON ===");
  console.log(JSON.stringify(order, null, 2));
}
