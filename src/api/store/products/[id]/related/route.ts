import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MEILISEARCH_MODULE } from "../../../../../modules/meilisearch";
import MeilisearchModuleService from "../../../../../modules/meilisearch/service";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  console.log(`[Related Products] Fetching for product: ${id}`);

  try {
    const meilisearchModuleService =
      req.scope.resolve<MeilisearchModuleService>(MEILISEARCH_MODULE);

    console.log(`[Related Products] Meilisearch module resolved`);

    // Get the Meilisearch client directly to use advanced search options
    const indexName = await meilisearchModuleService.getIndexName("product");
    const client = (meilisearchModuleService as any).client;
    const index = client.index(indexName);

    console.log(`[Related Products] Using index: ${indexName}`);

    // Get all products except current one
    let allProducts;
    try {
      allProducts = await index.search("", {
        filter: `id != "${id}"`,
        limit: 6,
      });
      console.log(
        `[Related Products] Found ${allProducts.hits?.length || 0} products from Meilisearch`,
      );
    } catch (searchError: any) {
      console.error(`[Related Products] Search error:`, searchError.message);
      return res.json({
        related_products: [],
        count: 0,
        error: "Search failed",
      });
    }

    if (!allProducts.hits || allProducts.hits.length === 0) {
      console.log(`[Related Products] No products found`);
      return res.json({
        related_products: [],
        count: 0,
      });
    }

    // Transform Meilisearch results to frontend-friendly format
    const formattedProducts = allProducts.hits.map((hit: any) => {
      return {
        id: hit.id,
        title: hit.title,
        handle: hit.handle,
        thumbnail: hit.thumbnail,
        price: hit.min_price || 0,
        min_price: hit.min_price || 0,
        max_price: hit.max_price || 0,
        original_price: hit.original_price || null,
        original_min_price: hit.original_min_price || null,
        original_max_price: hit.original_max_price || null,
        has_discount: hit.has_discount || false,
        currency_code: "php",
        in_stock: hit.in_stock || false,
        rating_average: hit.rating_average || 0,
        rating_count: hit.rating_count || 0,
        sales_count: hit.sales_count || 0,
        categories: hit.categories || [],
        brand: hit.brand || null,
      };
    });

    console.log(
      `[Related Products] Returning ${formattedProducts.length} products`,
    );

    res.json({
      related_products: formattedProducts,
      count: formattedProducts.length,
    });
  } catch (error: any) {
    console.error(`[Related Products] Error:`, error.message);
    console.error(`[Related Products] Stack:`, error.stack);
    res.json({
      related_products: [],
      count: 0,
      error: error.message,
    });
  }
};
