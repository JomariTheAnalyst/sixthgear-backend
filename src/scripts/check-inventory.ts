import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function checkInventory({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  console.log("\n=== Checking Inventory Level Structure ===\n");

  try {
    // Get a sample product with variants
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.manage_inventory",
        "variants.allow_backorder",
        "variants.inventory_items.inventory_item_id",
        "variants.inventory_items.required_quantity",
      ],
      filters: {},
      pagination: { take: 1 },
    });

    if (!products || products.length === 0) {
      console.log("No products found");
      return;
    }

    const product = products[0];
    console.log(`Product: ${product.title} (${product.id})`);

    for (const variant of product.variants) {
      console.log(`\nVariant: ${variant.title || variant.sku} (${variant.id})`);
      console.log(`  - manage_inventory: ${variant.manage_inventory}`);
      console.log(`  - allow_backorder: ${variant.allow_backorder}`);
      console.log(
        `  - inventory_items: ${variant.inventory_items?.length || 0}`,
      );

      if (variant.inventory_items && variant.inventory_items.length > 0) {
        for (const link of variant.inventory_items) {
          console.log(`    - inventory_item_id: ${link.inventory_item_id}`);
          console.log(`    - required_quantity: ${link.required_quantity}`);

          // Get inventory levels for this item
          try {
            const { data: levels } = await query.graph({
              entity: "inventory_level",
              fields: [
                "id",
                "inventory_item_id",
                "location_id",
                "stocked_quantity",
                "reserved_quantity",
                "incoming_quantity",
              ],
              filters: { inventory_item_id: link.inventory_item_id },
            });

            console.log(
              `      - inventory_levels found: ${levels?.length || 0}`,
            );
            if (levels && levels.length > 0) {
              for (const level of levels) {
                console.log(`        - location: ${level.location_id}`);
                console.log(`        - stocked: ${level.stocked_quantity}`);
                console.log(`        - reserved: ${level.reserved_quantity}`);
                console.log(
                  `        - available: ${level.stocked_quantity - level.reserved_quantity}`,
                );
              }
            }
          } catch (error) {
            console.error(`      Error fetching inventory levels:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("\n=== Done ===\n");
}
