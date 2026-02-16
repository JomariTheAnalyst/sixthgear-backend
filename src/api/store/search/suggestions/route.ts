import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { q, limit = "8" } = req.query as { q?: string; limit?: string };

  // Validate query
  if (!q || typeof q !== "string" || q.length < 1) {
    return res.status(400).json({
      message:
        "Query parameter 'q' is required and must be at least 1 character",
    });
  }

  const normalizedQuery = q.trim().toLowerCase();
  const limitNum = parseInt(limit as string, 10) || 8;

  try {
    const knex = req.scope.resolve("__pg_connection__");

    // Get top queries that start with the search term
    const suggestions = await knex("search_tracking")
      .where("query", "like", `${normalizedQuery}%`)
      .orderBy("count", "desc")
      .limit(limitNum)
      .select("query", "count");

    res.status(200).json({
      suggestions: suggestions.map((s: any) => ({
        query: s.query,
        count: s.count,
      })),
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({
      message: "Failed to fetch suggestions",
      suggestions: [],
    });
  }
}
