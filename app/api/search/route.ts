import { NextRequest } from "next/server";
import { getApiBase } from "../../libs/api";
import { getIndexStatus, searchAnime } from "../../libs/search";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (!query.trim()) {
    return Response.json({ results: [], query, index: getIndexStatus() });
  }

  const apiBase = getApiBase();
  const results = await searchAnime(query, apiBase);

  return Response.json({ results, query, index: getIndexStatus() });
}
