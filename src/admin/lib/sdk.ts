import Medusa from "@medusajs/js-sdk";

/**
 * Medusa JS SDK Configuration for Admin
 */
export const sdk = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  auth: {
    type: "session",
  },
});
