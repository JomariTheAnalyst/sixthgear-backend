import("meilisearch").then(({ MeiliSearch }) => {
  const client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
    apiKey: process.env.MEILISEARCH_API_KEY || "",
  });

  const indexName =
    process.env.MEILISEARCH_PRODUCT_INDEX_NAME || "sixthgear_products";

  async function configureMeilisearch() {
    console.log("Configuring Meilisearch settings...");

    try {
      const index = client.index(indexName);

      // Configure searchable attributes (in order of importance)
      console.log("Setting searchable attributes...");
      await index.updateSearchableAttributes([
        "title",
        "description",
        "categories.name",
        "tags.value",
        "handle",
      ]);

      // Configure filterable attributes
      console.log("Setting filterable attributes...");
      await index.updateFilterableAttributes([
        "categories.id",
        "categories.name",
        "categories.handle",
        "tags.value",
        "status",
        "price",
        "min_price",
        "max_price",
      ]);

      // Configure sortable attributes
      console.log("Setting sortable attributes...");
      await index.updateSortableAttributes([
        "title",
        "created_at",
        "updated_at",
        "price",
        "min_price",
      ]);

      console.log("✅ Meilisearch configuration complete!");
      console.log("\nSettings applied:");
      console.log(
        "- Searchable: title, description, categories.name, tags.value, handle",
      );
      console.log(
        "- Filterable: categories (id, name, handle), tags.value, status, price, min_price, max_price",
      );
      console.log(
        "- Sortable: title, created_at, updated_at, price, min_price",
      );
    } catch (error) {
      console.error("❌ Error configuring Meilisearch:", error);
      process.exit(1);
    }
  }

  configureMeilisearch();
});
