import { ExecArgs } from "@medusajs/framework/types";

export default async function checkProductCollections({ container }: ExecArgs) {
  console.log("\n=== Checking Product Collections in Medusa ===\n");

  try {
    const query = container.resolve("query");

    // Fetch products with collection data
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "collection.id",
        "collection.title",
        "collection.handle",
      ],
      pagination: {
        take: 20,
      },
    });

    console.log(`Total products checked: ${products.length}\n`);

    let productsWithCollections = 0;
    let productsWithoutCollections = 0;

    console.log("Products and their collections:\n");
    products.forEach((product: any, idx: number) => {
      console.log(`${idx + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      if (product.collection) {
        console.log(
          `   ✅ Collection: ${product.collection.title} (${product.collection.handle})`,
        );
        console.log(`   Collection ID: ${product.collection.id}`);
        productsWithCollections++;
      } else {
        console.log(`   ❌ NO COLLECTION ASSIGNED`);
        productsWithoutCollections++;
      }
      console.log("");
    });

    console.log("\n=== Summary ===");
    console.log(`Products with collections: ${productsWithCollections}`);
    console.log(`Products without collections: ${productsWithoutCollections}`);

    if (productsWithoutCollections > 0) {
      console.log(
        "\n⚠️  WARNING: Some products don't have collections assigned!",
      );
      console.log("To use brand filtering, you need to:");
      console.log("1. Go to Medusa Admin → Products");
      console.log("2. Edit each product and assign a collection");
      console.log("3. Re-sync products to Meilisearch");
    }

    console.log("\n=== Done ===\n");
  } catch (error) {
    console.error("❌ Error checking product collections:", error);
    throw error;
  }
}
