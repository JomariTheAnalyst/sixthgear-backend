import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { query } = req.body as { query: string };

  // Validate query
  if (!query || typeof query !== "string") {
    return res.status(400).json({
      message: "Query is required and must be a string",
    });
  }

  // Normalize query
  const normalizedQuery = query.trim().toLowerCase();

  // Ignore very short queries
  if (normalizedQuery.length < 2) {
    return res.status(200).json({
      message: "Query too short, not tracked",
    });
  }

  try {
    const knex = req.scope.resolve("__pg_connection__");

    // Check if query exists
    const existing = await knex("search_tracking")
      .where("query", normalizedQuery)
      .first();

    if (existing) {
      // Increment count
      await knex("search_tracking")
        .where("query", normalizedQuery)
        .update({
          count: knex.raw("count + 1"),
          updated_at: new Date(),
        });
    } else {
      // Insert new query
      await knex("search_tracking").insert({
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query: normalizedQuery,
        count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    res.status(200).json({
      message: "Search tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking search:", error);
    res.status(500).json({
      message: "Failed to track search",
    });
  }
}
