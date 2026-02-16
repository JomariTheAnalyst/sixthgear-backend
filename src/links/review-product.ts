import { defineLink } from "@medusajs/framework/utils";
import ProductReviewModule from "../modules/product-review";
import ProductModule from "@medusajs/medusa/product";

/**
 * Link between Review and Product
 * Allows querying reviews with product data
 */
export default defineLink(
  ProductReviewModule.linkable.review,
  ProductModule.linkable.product,
);
