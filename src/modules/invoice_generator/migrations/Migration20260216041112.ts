import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216041112 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "invoice" drop constraint if exists "invoice_invoice_number_unique";`);
    this.addSql(`create table if not exists "invoice" ("id" text not null, "order_id" text not null, "invoice_number" text not null, "pdf_url" text null, "status" text check ("status" in ('pending', 'generated', 'stale', 'failed')) not null default 'pending', "generated_at" timestamptz null, "is_stale" boolean not null default false, "error_message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_invoice_number_unique" ON "invoice" ("invoice_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_deleted_at" ON "invoice" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "invoice_config" ("id" text not null, "company_name" text not null default 'SixthGear Coffee', "company_address" text null, "company_phone" text null, "company_email" text null, "company_logo_url" text null, "tax_id" text null, "invoice_prefix" text not null default 'INV', "next_invoice_number" integer not null default 1, "invoice_notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_config_deleted_at" ON "invoice_config" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "invoice" cascade;`);

    this.addSql(`drop table if exists "invoice_config" cascade;`);
  }

}
