import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Seed sample marketing data for testing
 * Run with: npx medusa exec src/scripts/seed-marketing.ts
 */
export default async function seedMarketing({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const marketingModule = container.resolve("marketing") as any;

  console.log("🎯 Seeding marketing data...");

  // Sample Announcement Strip
  const strip = await marketingModule.createMarketingItems({
    type: "strip",
    status: "published",
    title: "Free Shipping",
    message: "🏍️ Free shipping on orders over ₱2,500! Limited time only.",
    cta_text: "Shop Now",
    cta_url: "/shop",
    background_color: "#F16D34",
    text_color: "#FFFFFF",
    enabled: true,
    priority: 100,
    pages: ["*"],
    device: "all",
  });
  console.log("✅ Created announcement strip:", strip.id);

  // Sample Banner - Home Hero Below
  const banner1 = await marketingModule.createMarketingItems({
    type: "banner",
    status: "published",
    title: "New Arrivals",
    message: "Check out our latest motorcycle gear and accessories",
    cta_text: "Explore",
    cta_url: "/shop?tag=new-arrival",
    background_color: "#1a1a1a",
    text_color: "#ffffff",
    enabled: true,
    priority: 50,
    pages: ["/"],
    device: "all",
    placement: "home_hero_below",
  });
  console.log("✅ Created banner (home_hero_below):", banner1.id);

  // Sample Banner - Home Mid
  const banner2 = await marketingModule.createMarketingItems({
    type: "banner",
    status: "published",
    title: "Helmet Sale",
    message: "Up to 30% off on selected helmets",
    cta_text: "Shop Helmets",
    cta_url: "/shop?category=helmet",
    background_color: "#F16D34",
    text_color: "#ffffff",
    enabled: true,
    priority: 40,
    pages: ["/"],
    device: "all",
    placement: "home_mid",
  });
  console.log("✅ Created banner (home_mid):", banner2.id);

  // Sample Popup
  const popup = await marketingModule.createMarketingItems({
    type: "popup",
    status: "published",
    title: "Welcome to Sixthgear!",
    message: "Subscribe to our newsletter and get 10% off your first order.",
    cta_text: "Subscribe",
    cta_url: "/newsletter",
    enabled: true,
    priority: 100,
    pages: ["/"],
    device: "all",
    delay_ms: 3000,
    frequency: "once_day",
    dismiss_key: "welcome_popup",
  });
  console.log("✅ Created popup:", popup.id);

  // Sample Draft Item (for preview testing)
  const draftBanner = await marketingModule.createMarketingItems({
    type: "banner",
    status: "draft",
    title: "DRAFT: Upcoming Sale",
    message: "This is a draft banner - only visible in preview mode",
    cta_text: "Preview Only",
    cta_url: "/shop",
    background_color: "#9333ea",
    text_color: "#ffffff",
    enabled: true,
    priority: 200,
    pages: ["/"],
    device: "all",
    placement: "home_hero_below",
  });
  console.log("✅ Created draft banner (for preview testing):", draftBanner.id);

  console.log("\n🎉 Marketing data seeded successfully!");
  console.log("\nTo test preview:");
  console.log(`1. Call POST /admin/marketing/${draftBanner.id}/preview-token`);
  console.log("2. Use the returned preview_url to see draft content");
}
