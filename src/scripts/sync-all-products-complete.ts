import { ExecArgs } from "@medusajs/framework/types";

export default async function syncAllProductsComplete({ container }: ExecArgs) {
  console.log("\n=== Syncing All Products with Complete Data ===\n");

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

    // Fetch all products with complete data
    console.log("Fetching products...");
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
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.inventory_quantity",
        "variants.manage_inventory",
        "variants.allow_backorder",
        "metadata",
      ],
      filters: {
        status: ["published"],
      },
    });

    console.log(`Found ${products.length} published products\n`);

    // Transform products with complete data
    const productsToIndex = products.map((product: any) => {
      // Calculate prices from variant prices (accept any currency)
      const prices: number[] = [];
      product.variants?.forEach((variant: any) => {
        variant.prices?.forEach((price: any) => {
          if (price.amount) {
            prices.push(price.amount);
          }
        });
      });

      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const price = minPrice;

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

      // Extract sale price from metadata (if set manually in admin)
      const salePrice = product.metadata?.sale_price
        ? Number(product.metadata.sale_price)
        : null;
      const originalPrice = product.metadata?.original_price
        ? Number(product.metadata.original_price)
        : null;
      const hasDiscount =
        salePrice !== null &&
        originalPrice !== null &&
        salePrice < originalPrice;

      const productData = {
        id: product.id,
        title: product.title,
        description: product.description,
        handle: product.handle,
        thumbnail: product.thumbnail,
        categories: product.categories || [],
        tags: product.tags || [],
        price: salePrice || price,
        min_price: salePrice || minPrice,
        max_price: salePrice || maxPrice,
        original_price: hasDiscount ? originalPrice : null,
        original_min_price: hasDiscount ? originalPrice : null,
        original_max_price: hasDiscount ? originalPrice : null,
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
      const priceInfo = hasDiscount
        ? `💰 SALE: ₱${(salePrice! / 100).toFixed(2)} (was ₱${(originalPrice! / 100).toFixed(2)})`
        : `Price: ₱${(price / 100).toFixed(2)}`;

      console.log(`${product.title}`);
      console.log(`  ${stockStatus} | ${brandInfo} | ${ratingInfo}`);
      console.log(`  ${priceInfo}`);

      return productData;
    });

    // Index to Meilisearch
    console.log(
      `\nIndexing ${productsToIndex.length} products to Meilisearch...`,
    );
    await index.addDocuments(productsToIndex, { primaryKey: "id" });

    console.log("\n✅ Products synced successfully!");
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
