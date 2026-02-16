import { ExecArgs } from "@medusajs/framework/types";

export default async function checkBrandData({}: ExecArgs) {
  console.log("\n=== Checking Brand Data in Meilisearch ===\n");

  try {
    const { MeiliSearch } = await import("meilisearch");

    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
      apiKey: process.env.MEILISEARCH_API_KEY || "",
    });

    const indexName =
      process.env.MEILISEARCH_PRODUCT_INDEX_NAME || "sixthgear_products";

    console.log(`Checking index: ${indexName}`);
    console.log(`Host: ${process.env.MEILISEARCH_HOST}\n`);

    const index = client.index(indexName);

    // Get first 10 products to check brand data
    const results = await index.search("", {
      limit: 10,
    });

    console.log(`Total products in index: ${results.estimatedTotalHits}\n`);

    console.log("Sample products with brand data:\n");
    results.hits.forEach((hit: any, idx: number) => {
      console.log(`${idx + 1}. Product: ${hit.title}`);
      console.log(`   ID: ${hit.id}`);
      console.log(`   Brand:`, hit.brand || "NO BRAND DATA");
      console.log(`   Collection:`, hit.collection || "N/A");
      console.log("");
    });

    // Check filterable attributes
    console.log("\nChecking index settings...");
    const settings = await index.getSettings();
    console.log("\nFilterable attributes:");
    console.log(settings.filterableAttributes);

    // Test brand filter
    console.log("\n\nTesting brand filter...");
    const brandResults = await index.search("", {
      filter: 'brand.handle = "nespresso"',
      limit: 5,
    });
    console.log(
      `Products with brand.handle = "nespresso": ${brandResults.estimatedTotalHits}`,
    );

    // Get unique brands
    console.log("\n\nGetting unique brands...");
    const allResults = await index.search("", {
      limit: 1000,
    });

    const brands = new Map<
      string,
      { id: string; name: string; handle: string }
    >();
    allResults.hits.forEach((hit: any) => {
      if (hit.brand && hit.brand.handle) {
        brands.set(hit.brand.handle, {
          id: hit.brand.id,
          name: hit.brand.name,
          handle: hit.brand.handle,
        });
      }
    });

    console.log(`\nUnique brands found: ${brands.size}`);
    brands.forEach((brand) => {
      console.log(`- ${brand.name} (${brand.handle})`);
    });

    console.log("\n=== Done ===\n");
  } catch (error) {
    console.error("❌ Error checking brand data:", error);
    throw error;
  }
}
