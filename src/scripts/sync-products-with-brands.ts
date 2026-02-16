import { ExecArgs } from "@medusajs/framework/types";

export default async function syncProductsWithBrands({ container }: ExecArgs) {
  console.log("\n=== Syncing Products with Brand Data ===\n");

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

    // Fetch all products
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
      ],
      filters: {
        status: ["published"],
      },
    });

    console.log(`Found ${products.length} published products\n`);

    // Transform products with brand data
    const productsToIndex = products.map((product: any) => {
      // Calculate prices from variant prices
      const prices: number[] = [];
      product.variants?.forEach((variant: any) => {
        variant.prices?.forEach((price: any) => {
          if (price.amount && price.currency_code === "PHP") {
            prices.push(price.amount);
          }
        });
      });

      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const price = minPrice;

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
          console.log(
            `✅ ${product.title} → Brand: ${brand.name} (${brand.handle})`,
          );
        } else {
          console.log(`⚠️  ${product.title} → Collection ID not found in map`);
        }
      } else {
        console.log(`❌ ${product.title} → No collection assigned`);
      }

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        handle: product.handle,
        thumbnail: product.thumbnail,
        categories: product.categories || [],
        tags: product.tags || [],
        price,
        min_price: minPrice,
        max_price: maxPrice,
        brand,
      };
    });

    // Index to Meilisearch
    console.log(
      `\nIndexing ${productsToIndex.length} products to Meilisearch...`,
    );
    await index.addDocuments(productsToIndex, { primaryKey: "id" });

    console.log("\n✅ Products synced successfully!");
    console.log("\n=== Summary ===");
    const productsWithBrands = productsToIndex.filter((p) => p.brand !== null);
    console.log(`Products with brands: ${productsWithBrands.length}`);
    console.log(
      `Products without brands: ${productsToIndex.length - productsWithBrands.length}`,
    );

    console.log("\n=== Done ===\n");
  } catch (error) {
    console.error("❌ Error syncing products:", error);
    throw error;
  }
}
