import { ExecArgs } from "@medusajs/framework/types";

export default async function configureMeilisearchIndex({}: ExecArgs) {
  console.log("\n=== Configuring Meilisearch Index ===\n");

  try {
    const { MeiliSearch } = await import("meilisearch");

    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
      apiKey: process.env.MEILISEARCH_API_KEY || "",
    });

    const indexName =
      process.env.MEILISEARCH_PRODUCT_INDEX_NAME || "sixthgear_products";

    console.log(`Configuring index: ${indexName}`);
    console.log(`Host: ${process.env.MEILISEARCH_HOST}\n`);

    const index = client.index(indexName);

    // Configure searchable attributes (in order of importance)
    console.log("Setting searchable attributes...");
    await index.updateSearchableAttributes([
      "title",
      "description",
      "categories.name",
      "tags.value",
      "brand.name",
      "handle",
    ]);

    // Configure filterable attributes
    console.log("Setting filterable attributes...");
    await index.updateFilterableAttributes([
      "id",
      "categories.id",
      "categories.name",
      "categories.handle",
      "tags.value",
      "brand.id",
      "brand.name",
      "brand.handle",
      "status",
      "price",
      "min_price",
      "max_price",
      "in_stock",
    ]);

    // Configure sortable attributes
    console.log("Setting sortable attributes...");
    await index.updateSortableAttributes([
      "title",
      "created_at",
      "updated_at",
      "price",
      "min_price",
      "sales_count",
      "rating_average",
    ]);

    console.log("\n✅ Meilisearch configuration complete!\n");
    console.log("Settings applied:");
    console.log(
      "- Searchable: title, description, categories.name, tags.value, brand.name, handle",
    );
    console.log(
      "- Filterable: id, categories (id, name, handle), tags.value, brand (id, name, handle), status, price, min_price, max_price, in_stock",
    );
    console.log(
      "- Sortable: title, created_at, updated_at, price, min_price, sales_count, rating_average",
    );
    console.log("\n=== Done ===\n");
  } catch (error) {
    console.error("❌ Error configuring Meilisearch:", error);
    throw error;
  }
}
