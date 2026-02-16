import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

/**
 * Check Product Metadata
 * Verify that rating metadata is stored correctly
 */
export default async function checkProductMetadata({
  container,
}: {
  container: MedusaContainer;
}) {
  const productModuleService = container.resolve(Modules.PRODUCT);

  console.log("=== Checking Product Metadata ===");

  try {
    // Get the product with reviews
    const productId = "prod_01KERKK60WMA32T7TNKZDAZPK2";

    const [product] = await productModuleService.listProducts({
      id: [productId],
    });

    if (!product) {
      console.log("Product not found");
      return;
    }

    console.log("\nProduct:", product.title);
    console.log("Metadata:", JSON.stringify(product.metadata, null, 2));
    console.log("\nRating Average:", product.metadata?.rating_average);
    console.log("Rating Count:", product.metadata?.rating_count);
  } catch (error) {
    console.error("Error:", error);
  }
}
