import { Migration } from "@mikro-orm/migrations";

export class Migration20250116000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "marketing_item" (
        "id" VARCHAR(255) NOT NULL,
        "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('strip', 'banner', 'popup')),
        "status" VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'published')),
        "title" TEXT,
        "message" TEXT,
        "cta_text" TEXT,
        "cta_url" TEXT,
        "image_desktop_url" TEXT,
        "image_mobile_url" TEXT,
        "background_color" VARCHAR(50),
        "text_color" VARCHAR(50),
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "start_at" TIMESTAMPTZ,
        "end_at" TIMESTAMPTZ,
        "pages" JSONB NOT NULL DEFAULT '[]',
        "device" VARCHAR(50) NOT NULL DEFAULT 'all' CHECK ("device" IN ('all', 'mobile', 'desktop')),
        "placement" VARCHAR(100),
        "delay_ms" INTEGER DEFAULT 2000,
        "frequency" VARCHAR(50) DEFAULT 'once_session' CHECK ("frequency" IN ('once_session', 'once_day', 'always')),
        "dismiss_key" VARCHAR(100),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY ("id")
      );

      CREATE INDEX "idx_marketing_item_type" ON "marketing_item" ("type");
      CREATE INDEX "idx_marketing_item_status" ON "marketing_item" ("status");
      CREATE INDEX "idx_marketing_item_enabled" ON "marketing_item" ("enabled");
      CREATE INDEX "idx_marketing_item_priority" ON "marketing_item" ("priority" DESC);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "marketing_item"`);
  }
}
