import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // Get product with variants and their inventory items
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "variants.id",
        "variants.manage_inventory",
        "variants.allow_backorder",
        "variants.inventory_items.inventory_item_id",
      ],
      filters: { id },
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = products[0];

    // Get inventory for each variant
    const variantsWithInventory = await Promise.all(
      product.variants.map(async (variant: any) => {
        // If backorder is allowed, always in stock
        if (variant.allow_backorder) {
          return {
            variant_id: variant.id,
            manage_inventory: variant.manage_inventory,
            allow_backorder: true,
            inventory_quantity: null,
            in_stock: true,
          };
        }

        // If not managing inventory, assume in stock
        if (!variant.manage_inventory) {
          return {
            variant_id: variant.id,
            manage_inventory: false,
            inventory_quantity: null,
            in_stock: true,
          };
        }

        try {
          // Get inventory item IDs for this variant
          const inventoryItemIds =
            variant.inventory_items?.map((ii: any) => ii.inventory_item_id) ||
            [];

          if (inventoryItemIds.length === 0) {
            return {
              variant_id: variant.id,
              manage_inventory: true,
              inventory_quantity: 0,
              in_stock: false,
            };
          }

          // Query inventory levels directly
          const { data: inventoryLevels } = await query.graph({
            entity: "inventory_level",
            fields: [
              "stocked_quantity",
              "reserved_quantity",
              "inventory_item_id",
            ],
            filters: {
              inventory_item_id: inventoryItemIds,
            },
          });

          if (!inventoryLevels || inventoryLevels.length === 0) {
            return {
              variant_id: variant.id,
              manage_inventory: true,
              inventory_quantity: 0,
              in_stock: false,
            };
          }

          // Calculate total available quantity across all locations
          const totalQuantity = inventoryLevels.reduce(
            (total: number, level: any) => {
              const available =
                (level.stocked_quantity || 0) - (level.reserved_quantity || 0);
              return total + Math.max(0, available);
            },
            0,
          );

          return {
            variant_id: variant.id,
            manage_inventory: true,
            inventory_quantity: totalQuantity,
            in_stock: totalQuantity > 0,
          };
        } catch (error) {
          console.error(
            `Error fetching inventory for variant ${variant.id}:`,
            error,
          );
          return {
            variant_id: variant.id,
            manage_inventory: true,
            inventory_quantity: 0,
            in_stock: false,
          };
        }
      }),
    );

    return res.json({
      product_id: product.id,
      variants: variantsWithInventory,
    });
  } catch (error) {
    console.error("Error fetching product inventory:", error);
    return res.status(500).json({
      message: "Failed to fetch inventory",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
