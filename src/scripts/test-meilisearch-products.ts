import { ExecArgs } from "@medusajs/framework/types";

export default async function testMeilisearchProducts({ container }: ExecArgs) {
  console.log("\n=== Testing Meilisearch Products ===\n");

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

    // Get index stats
    const stats = await index.getStats();
    console.log(`Total documents in index: ${stats.numberOfDocuments}`);

    // Get first 5 products
    const results = await index.search("", { limit: 5 });
    console.log(`\nFound ${results.hits.length} products:`);

    results.hits.forEach((product: any) => {
      console.log(`- ${product.title} (${product.id})`);
      console.log(`  Handle: ${product.handle}`);
      console.log(`  Price: ${product.price}`);
      console.log(`  In Stock: ${product.in_stock}`);
      console.log(`  Brand: ${product.brand?.name || "No brand"}`);
      console.log(`  Categories: ${product.categories?.length || 0}`);
      console.log("");
    });

    console.log("\n=== Done ===\n");
  } catch (error) {
    console.error("❌ Error testing Meilisearch:", error);
    throw error;
  }
}
