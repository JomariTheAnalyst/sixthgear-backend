import { MedusaContainer } from "@medusajs/framework/types";

export default async function testOrderApiDirect({
  container,
}: {
  container: MedusaContainer;
}) {
  const query = container.resolve("query");

  // Get the latest order
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "total",
      "subtotal",
      "shipping_total",
      "currency_code",
      "items.*",
      "items.title",
      "items.subtitle",
      "items.quantity",
      "items.total",
      "items.unit_price",
      "shipping_methods.*",
      "shipping_methods.name",
      "shipping_methods.amount",
      "payment_collections.*",
      "payment_collections.payment_sessions.*",
      "payment_collections.payment_sessions.provider_id",
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

  console.log("\n=== SIMULATING FRONTEND API CALL ===");
  console.log("Order ID:", order.id);
  console.log("\n=== ITEMS ===");
  console.log("Items array:", order.items);
  console.log("Items count:", order.items?.length || 0);

  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, i: number) => {
      console.log(`\nItem ${i + 1}:`);
      console.log("  title:", item.title);
      console.log("  subtitle:", item.subtitle);
      console.log("  quantity:", item.quantity);
      console.log("  total:", item.total);
      console.log("  unit_price:", item.unit_price);
    });
  }

  console.log("\n=== TOTALS ===");
  console.log("subtotal:", order.subtotal);
  console.log("shipping_total:", order.shipping_total);
  console.log("total:", order.total);

  console.log("\n=== SHIPPING METHODS ===");
  console.log("shipping_methods:", order.shipping_methods);
  if (order.shipping_methods && order.shipping_methods.length > 0) {
    order.shipping_methods.forEach((sm: any, i: number) => {
      console.log(`\nShipping Method ${i + 1}:`);
      console.log("  name:", sm.name);
      console.log("  amount:", sm.amount);
    });
  }

  console.log("\n=== PAYMENT ===");
  console.log("payment_collections:", order.payment_collections);
  if (order.payment_collections && order.payment_collections.length > 0) {
    const pc = order.payment_collections[0];
    console.log("Payment collection ID:", pc.id);
    if (pc.payment_sessions && pc.payment_sessions.length > 0) {
      const ps = pc.payment_sessions[0];
      console.log("Payment session provider_id:", ps.provider_id);
      console.log("Is COD?:", ps.provider_id === "pp_system_default");
    }
  }

  console.log("\n=== FULL JSON (what frontend should receive) ===");
  console.log(JSON.stringify(order, null, 2));
}
