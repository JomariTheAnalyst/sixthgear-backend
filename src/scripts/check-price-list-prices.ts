import { ExecArgs } from "@medusajs/framework/types";

export default async function checkPriceListPrices({ container }: ExecArgs) {
  console.log("\n=== Checking Price List Prices ===\n");

  try {
    const query = container.resolve("query");

    // Fetch a product with all price data
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "variants.id",
        "variants.title",
        "variants.prices.id",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.prices.price_list_id",
        "variants.prices.price_list.id",
        "variants.prices.price_list.title",
        "variants.prices.price_list.type",
      ],
      filters: {
        title: ["Medusa Sweatpants"],
      },
    });

    if (!products || products.length === 0) {
      console.log("No products found");
      return;
    }

    const product = products[0];
    console.log(`Product: ${product.title}`);
    console.log(`ID: ${product.id}\n`);

    product.variants?.forEach((variant: any, index: number) => {
      console.log(`Variant ${index + 1}: ${variant.title || variant.id}`);
      console.log(`  Prices:`);

      variant.prices?.forEach((price: any) => {
        const priceListInfo = price.price_list_id
          ? ` (Price List: ${price.price_list?.title || price.price_list_id})`
          : " (Base Price)";
        console.log(
          `    - ₱${(price.amount / 100).toFixed(2)} ${price.currency_code}${priceListInfo}`,
        );
      });
      console.log("");
    });

    console.log("\n=== Done ===\n");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}
