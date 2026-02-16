import { ExecArgs } from "@medusajs/framework/types";

export default async function syncProductsWithPriceLists({
  container,
}: ExecArgs) {
  console.log("\n=== Syncing Products with Price List Prices ===\n");

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

    // First, fetch all products without calculated_price
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
        "variants.prices.price_list_id",
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
    console.log("Fetching calculated prices for each product...\n");

    // Now fetch each product individually with calculated_price
    const productsToIndex = [];

    for (const product of products) {
      try {
        // Fetch this product with calculated_price
        const { data: productWithPrices } = await query.graph({
          entity: "product",
          fields: [
            "id",
            "variants.id",
            "variants.calculated_price.calculated_amount",
            "variants.calculated_price.original_amount",
            "variants.calculated_price.currency_code",
          ],
          filters: {
            id: [product.id],
          },
          context: {
            region_id: region.id,
            currency_code: region.currency_code,
          },
        });

        const productData = productWithPrices[0];

        // Calculate prices from variants
        const calculatedPrices: number[] = [];
        const originalPrices: number[] = [];
        const basePrices: number[] = [];

        // Get base prices (without price list)
        product.variants?.forEach((variant: any) => {
          variant.prices?.forEach((price: any) => {
            if (price.amount && !price.price_list_id) {
              basePrices.push(price.amount);
            }
          });
        });

        // Get calculated prices (with price list applied)
        productData?.variants?.forEach((variant: any) => {
          if (variant.calculated_price?.calculated_amount) {
            calculatedPrices.push(variant.calculated_price.calculated_amount);
          }
          if (variant.calculated_price?.original_amount) {
            originalPrices.push(variant.calculated_price.original_amount);
          }
        });

        const minCalculatedPrice =
          calculatedPrices.length > 0 ? Math.min(...calculatedPrices) : 0;
        const maxCalculatedPrice =
          calculatedPrices.length > 0 ? Math.max(...calculatedPrices) : 0;
        const minOriginalPrice =
          originalPrices.length > 0 ? Math.min(...originalPrices) : 0;
        const maxOriginalPrice =
          originalPrices.length > 0 ? Math.max(...originalPrices) : 0;
        const minBasePrice =
          basePrices.length > 0 ? Math.min(...basePrices) : 0;

        // Determine if there's a discount (calculated < original)
        const hasDiscount =
          minOriginalPrice > 0 && minCalculatedPrice < minOriginalPrice;

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

        const indexData = {
          id: product.id,
          title: product.title,
          description: product.description,
          handle: product.handle,
          thumbnail: product.thumbnail,
          categories: product.categories || [],
          tags: product.tags || [],
          price: minCalculatedPrice || minBasePrice,
          min_price: minCalculatedPrice || minBasePrice,
          max_price: maxCalculatedPrice || minBasePrice,
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

        productsToIndex.push(indexData);

        // Log product info
        const stockStatus = inStock ? "✅ In Stock" : "❌ Out of Stock";
        const brandInfo = brand ? `Brand: ${brand.name}` : "No Brand";
        const ratingInfo =
          ratingCount > 0
            ? `Rating: ${ratingAverage.toFixed(1)} (${ratingCount})`
            : "No Ratings";
        const priceInfo = hasDiscount
          ? `💰 SALE: ₱${(minCalculatedPrice / 100).toFixed(2)} (was ₱${(minOriginalPrice / 100).toFixed(2)})`
          : `Price: ₱${((minCalculatedPrice || minBasePrice) / 100).toFixed(2)}`;

        console.log(`${product.title}`);
        console.log(`  ${stockStatus} | ${brandInfo} | ${ratingInfo}`);
        console.log(`  ${priceInfo}`);
      } catch (error: any) {
        console.error(`❌ Error processing ${product.title}:`, error.message);
        // Continue with next product
      }
    }

    // Index to Meilisearch
    console.log(
      `\nIndexing ${productsToIndex.length} products to Meilisearch...`,
    );
    await index.addDocuments(productsToIndex, { primaryKey: "id" });

    console.log("\n✅ Products synced successfully with price list prices!");
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
