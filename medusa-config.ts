import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    databaseDriverOptions: {
      connection: {
        // Supabase requires SSL, RDS can use SSL or not
        ssl: process.env.DATABASE_URL?.includes("supabase")
          ? { rejectUnauthorized: false }
          : false,
      },
    },
  },
  modules: [
    // Contact Inquiry Module - Custom module for handling contact form submissions
    {
      resolve: "./src/modules/contact-inquiry",
    },
    // Wishlist Module - Custom module for customer wishlists
    {
      resolve: "./src/modules/wishlist",
    },
    // Product Review Module - Custom module for product reviews
    {
      resolve: "./src/modules/product-review",
    },
    // Invoice Generator Module - PDF invoice generation for orders
    {
      resolve: "./src/modules/invoice_generator",
    },
    // Meilisearch Module - Search engine integration
    {
      resolve: "./src/modules/meilisearch",
      options: {
        host: process.env.MEILISEARCH_HOST!,
        apiKey: process.env.MEILISEARCH_API_KEY!,
        productIndexName: process.env.MEILISEARCH_PRODUCT_INDEX_NAME!,
      },
    },
    // Redis Event Bus - for async event handling (requires Redis to be running)
    // {
    //   resolve: "@medusajs/medusa/event-bus-redis",
    //   options: {
    //     redisUrl: process.env.REDIS_URL,
    //   },
    // },
    // Redis Cache - for faster API responses (requires Redis to be running)
    // {
    //   resolve: "@medusajs/medusa/cache-redis",
    //   options: {
    //     redisUrl: process.env.REDIS_URL,
    //     ttl: 30, // Cache TTL in seconds
    //   },
    // },
    // Stripe Payment Provider
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    // Cloudflare R2 File Provider (S3-compatible)
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION || "auto",
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              // R2-specific: force path style for S3 compatibility
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
    // Notification Module - Handles both email and admin notifications
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          // Resend Email Provider - Sends emails to customers
          {
            resolve: "./src/modules/resend",
            id: "resend",
            options: {
              channels: ["email"],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL,
              orders_from: process.env.RESEND_ORDERS_EMAIL,
            },
          },
          // Local Notification Provider - Sends notifications to admin panel
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              channels: ["feed"], // Admin notification panel
            },
          },
        ],
      },
    },
  ],
});
