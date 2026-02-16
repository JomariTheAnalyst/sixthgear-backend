import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260213043326 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" alter column "title" type text using ("title"::text);`);
    this.addSql(`alter table if exists "review" alter column "title" drop not null;`);
    this.addSql(`alter table if exists "review" alter column "rating" type real using ("rating"::real);`);
    this.addSql(`alter table if exists "review" alter column "first_name" type text using ("first_name"::text);`);
    this.addSql(`alter table if exists "review" alter column "first_name" set not null;`);
    this.addSql(`alter table if exists "review" alter column "last_name" type text using ("last_name"::text);`);
    this.addSql(`alter table if exists "review" alter column "last_name" set not null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_REVIEW_PRODUCT_ID" ON "review" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "review" add constraint rating_range check(rating >= 1 AND rating <= 5);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_REVIEW_PRODUCT_ID";`);
    this.addSql(`alter table if exists "review" drop constraint if exists rating_range;`);

    this.addSql(`alter table if exists "review" alter column "title" type text using ("title"::text);`);
    this.addSql(`alter table if exists "review" alter column "title" set not null;`);
    this.addSql(`alter table if exists "review" alter column "rating" type integer using ("rating"::integer);`);
    this.addSql(`alter table if exists "review" alter column "first_name" type text using ("first_name"::text);`);
    this.addSql(`alter table if exists "review" alter column "first_name" drop not null;`);
    this.addSql(`alter table if exists "review" alter column "last_name" type text using ("last_name"::text);`);
    this.addSql(`alter table if exists "review" alter column "last_name" drop not null;`);
  }

}
