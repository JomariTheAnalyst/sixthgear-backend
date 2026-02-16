import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MEILISEARCH_MODULE } from "../../modules/meilisearch";
import MeilisearchModuleService from "../../modules/meilisearch/service";

export type SyncProductsStepInput = {
  products: {
    id: string;
    title: string;
    description?: string;
    handle: string;
    thumbnail?: string;
    categories: {
      id: string;
      name: string;
      handle: string;
    }[];
    tags: {
      id: string;
      value: string;
    }[];
    collection_id?: string | null;
    collection?: {
      id: string;
      title: string;
      handle: string;
    } | null;
    variants?: {
      id: string;
      calculated_price?: {
        calculated_amount?: number;
        currency_code?: string;
      };
      inventory_quantity?: number;
      manage_inventory?: boolean;
      allow_backorder?: boolean;
    }[];
    metadata?: {
      rating_average?: number;
      rating_count?: number;
      sales_count?: number;
    };
  }[];
};

export const syncProductsStep = createStep(
  "sync-products",
  async ({ products }: SyncProductsStepInput, { container }) => {
    const meilisearchModuleService =
      container.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE);

    const query = container.resolve("query");

    // Fetch all collections to map collection_id to collection data
    const { data: collections } = await query.graph({
      entity: "product_collection",
      fields: ["id", "title", "handle"],
    });

    const collectionMap = new Map(
      collections.map((c: any) => [
        c.id,
        { id: c.id, title: c.title, handle: c.handle },
      ]),
    );

    // Transform products to include price fields, brand, stock status, and rating data
    const productsWithPrices = products.map((product) => {
      const prices =
        product.variants
          ?.map((v) => v.calculated_price?.calculated_amount)
          .filter((p): p is number => p !== undefined && p !== null) || [];

      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const price = minPrice; // Use min price as default price

      // Calculate in_stock status
      const inStock =
        product.variants?.some((v) => {
          if (v.allow_backorder) return true;
          if (!v.manage_inventory) return true;
          if (
            v.inventory_quantity !== null &&
            v.inventory_quantity !== undefined
          ) {
            return v.inventory_quantity > 0;
          }
          return false;
        }) ?? false;

      // Get collection data from map using collection_id
      let brand = null;
      if (product.collection_id) {
        const collectionData = collectionMap.get(product.collection_id);
        if (collectionData) {
          brand = {
            id: collectionData.id,
            name: collectionData.title,
            handle: collectionData.handle,
          };
        }
      }

      // Extract rating and sales data from metadata
      const ratingAverage = product.metadata?.rating_average || 0;
      const ratingCount = product.metadata?.rating_count || 0;
      const salesCount = product.metadata?.sales_count || 0;

      return {
        ...product,
        price,
        min_price: minPrice,
        max_price: maxPrice,
        brand,
        in_stock: inStock,
        rating_average: ratingAverage,
        rating_count: ratingCount,
        sales_count: salesCount,
      };
    });

    const existingProducts = await meilisearchModuleService.retrieveFromIndex(
      productsWithPrices.map((product) => product.id),
      "product",
    );
    const newProducts = productsWithPrices.filter(
      (product) => !existingProducts.some((p) => p.id === product.id),
    );
    await meilisearchModuleService.indexData(
      productsWithPrices as unknown as Record<string, unknown>[],
      "product",
    );

    return new StepResponse(undefined, {
      newProducts: newProducts.map((product) => product.id),
      existingProducts,
    });
  },
  async (input, { container }) => {
    if (!input) {
      return;
    }

    const meilisearchModuleService =
      container.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE);

    if (input.newProducts) {
      await meilisearchModuleService.deleteFromIndex(
        input.newProducts,
        "product",
      );
    }

    if (input.existingProducts) {
      await meilisearchModuleService.indexData(
        input.existingProducts,
        "product",
      );
    }
  },
);
