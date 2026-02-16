import { ExecArgs } from "@medusajs/framework/types";

export default async function syncProductsWithSalePrices({
  container,
}: ExecArgs) {
  console.log("\n=== Syncing Products with Sale Prices ===\n");

  try {
    const query = container.resolve("query");
    const { MeiliSearch } = await import("meilisearch");

    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
      apiKey: process.env.MEILISEARCH_API_KEY || "",
    });

    const indexName =
      process.env.MEILISEARCH_PRODUCT_INDEX_NAME || "sixthgear_products";
    const index = client.index(indexName);

    // Get the default region (Philippines)
    console.log("Fetching region...");
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
      filters: {
        currency_code: ["php"],
      },
    });

    if (!regions || regions.length === 0) {
      console.error("❌ No PHP region found!");
      return;
    }

    const region = regions[0];
    console.log(`Using region: ${region.name} (${region.currency_code})\n`);

    // Fetch all collections
    console.log("Fetching collections...");
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
    console.log(`Found ${collections.length} collections\n`);

    // Fetch all products with calculated prices
    console.log("Fetching products with calculated prices...");
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "handle",
        "thumbnail",
        "status",
        "collection_id",
        "categories.id",
        "categories.name",
        "categories.handle",
        "tags.id",
        "tags.value",
        "variants.id",
        "variants.calculated_price.calculated_amount",
        "variants.calculated_price.original_amount",
        "variants.calculated_price.currency_code",
        "variants.inventory_quantity",
        "variants.manage_inventory",
        "variants.allow_backorder",
        "metadata",
      ],
      filters: {
        status: ["published"],
      },
      context: {
        region_id: region.id,
        currency_code: region.currency_code,
      },
    });

    console.log(`Found ${products.length} published products\n`);

    // Transform products with sale price data
    const productsToIndex = products.map((product: any) => {
      // Calculate prices from variants with calculated_price
      const calculatedPrices: number[] = [];
      const originalPrices: number[] = [];

      product.variants?.forEach((variant: any) => {
        if (variant.calculated_price?.calculated_amount) {
          calculatedPrices.push(variant.calculated_price.calculated_amount);
        }
        if (variant.calculated_price?.original_amount) {
          originalPrices.push(variant.calculated_price.original_amount);
        }
      });

      const minPrice =
        calculatedPrices.length > 0 ? Math.min(...calculatedPrices) : 0;
      const maxPrice =
        calculatedPrices.length > 0 ? Math.max(...calculatedPrices) : 0;
      const minOriginalPrice =
        originalPrices.length > 0 ? Math.min(...originalPrices) : 0;
      const maxOriginalPrice =
        originalPrices.length > 0 ? Math.max(...originalPrices) : 0;

      // Determine if there's a discount
      const hasDiscount = minOriginalPrice > 0 && minPrice < minOriginalPrice;

      // Calculate in_stock status
      const inStock =
        product.variants?.some((v: any) => {
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

      // Get brand from collection
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

      const productData = {
        id: product.id,
        title: product.title,
        description: product.description,
        handle: product.handle,
        thumbnail: product.thumbnail,
        categories: product.categories || [],
        tags: product.tags || [],
        price: minPrice,
        min_price: minPrice,
        max_price: maxPrice,
        original_price: hasDiscount ? minOriginalPrice : null,
        original_min_price: hasDiscount ? minOriginalPrice : null,
        original_max_price: hasDiscount ? maxOriginalPrice : null,
        has_discount: hasDiscount,
        brand,
        in_stock: inStock,
        rating_average: ratingAverage,
        rating_count: ratingCount,
        sales_count: salesCount,
      };

      // Log product info
      const stockStatus = inStock ? "✅ In Stock" : "❌ Out of Stock";
      const brandInfo = brand ? `Brand: ${brand.name}` : "No Brand";
      const ratingInfo =
        ratingCount > 0
          ? `Rating: ${ratingAverage.toFixed(1)} (${ratingCount})`
          : "No Ratings";
      const saleInfo = hasDiscount
        ? `💰 SALE: ₱${(minPrice / 100).toFixed(2)} (was ₱${(minOriginalPrice / 100).toFixed(2)})`
        : `Price: ₱${(minPrice / 100).toFixed(2)}`;

      console.log(`${product.title}`);
      console.log(`  ${stockStatus} | ${brandInfo} | ${ratingInfo}`);
      console.log(`  ${saleInfo}`);

      return productData;
    });

    // Index to Meilisearch
    console.log(
      `\nIndexing ${productsToIndex.length} products to Meilisearch...`,
    );
    await index.addDocuments(productsToIndex, { primaryKey: "id" });

    console.log("\n✅ Products synced successfully with sale prices!");
    console.log("\n=== Summary ===");

    const productsWithBrands = productsToIndex.filter((p) => p.brand !== null);
    const productsInStock = productsToIndex.filter((p) => p.in_stock);
    const productsWithRatings = productsToIndex.filter(
      (p) => p.rating_count > 0,
    );
    const productsOnSale = productsToIndex.filter((p) => p.has_discount);

    console.log(`Total products: ${productsToIndex.length}`);
    console.log(`Products with brands: ${productsWithBrands.length}`);
    console.log(`Products in stock: ${productsInStock.length}`);
    console.log(`Products with ratings: ${productsWithRatings.length}`);
    console.log(`Products on sale: ${productsOnSale.length}`);

    if (productsOnSale.length > 0) {
      console.log("\n🔥 Products on Sale:");
      productsOnSale.forEach((p) => {
        const discount = Math.round(
          ((p.original_min_price! - p.min_price) / p.original_min_price!) * 100,
        );
        console.log(
          `  - ${p.title}: ${discount}% off (₱${(p.min_price / 100).toFixed(2)} from ₱${(p.original_min_price! / 100).toFixed(2)})`,
        );
      });
    }

    console.log("\n=== Done ===\n");
  } catch (error) {
    console.error("❌ Error syncing products:", error);
    throw error;
  }
}
