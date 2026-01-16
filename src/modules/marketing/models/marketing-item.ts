import { model } from "@medusajs/framework/utils";

const MarketingItem = model.define("marketing_item", {
  id: model.id().primaryKey(),
  type: model.enum(["strip", "banner", "popup"]),
  status: model.enum(["draft", "published"]).default("draft"),
  title: model.text().nullable(),
  message: model.text().nullable(),
  cta_text: model.text().nullable(),
  cta_url: model.text().nullable(),
  image_desktop_url: model.text().nullable(),
  image_mobile_url: model.text().nullable(),
  background_color: model.text().nullable(),
  text_color: model.text().nullable(),
  enabled: model.boolean().default(true),
  priority: model.number().default(0),
  start_at: model.dateTime().nullable(),
  end_at: model.dateTime().nullable(),
  pages: model.json().default([]),
  device: model.enum(["all", "mobile", "desktop"]).default("all"),
  // Banner specific
  placement: model.text().nullable(),
  // Popup specific
  delay_ms: model.number().default(2000),
  frequency: model
    .enum(["once_session", "once_day", "always"])
    .default("once_session"),
  dismiss_key: model.text().nullable(),
});

export default MarketingItem;
