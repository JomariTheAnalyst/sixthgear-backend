import { ExecArgs } from "@medusajs/framework/types";

export default async function createSearchTrackingTable({
  container,
}: ExecArgs) {
  const knex = container.resolve("__pg_connection__");

  console.log("Creating search_tracking table...");

  try {
    // Check if table exists
    const tableExists = await knex.schema.hasTable("search_tracking");

    if (tableExists) {
      console.log("✅ Table 'search_tracking' already exists");
      return;
    }

    // Create table
    await knex.schema.createTable("search_tracking", (table: any) => {
      table.string("id").primary();
      table.string("query").notNullable();
      table.integer("count").notNullable().defaultTo(1);
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

      // Indexes
      table.index("query", "IDX_search_tracking_query");
      table.index("count", "IDX_search_tracking_count");
    });

    console.log("✅ Table 'search_tracking' created successfully");
    console.log(
      "✅ Indexes created: IDX_search_tracking_query, IDX_search_tracking_count",
    );
  } catch (error) {
    console.error("❌ Error creating search_tracking table:", error);
    throw error;
  }
}
