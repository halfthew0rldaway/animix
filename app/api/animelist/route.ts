import { NextRequest } from "next/server";
import { getApiBase, safeFetchJson } from "../../libs/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const letter = req.nextUrl.searchParams.get("letter") ?? "";
  const page = req.nextUrl.searchParams.get("page") ?? "1";

  if (!letter) {
    return Response.json({ error: "Missing letter" }, { status: 400 });
  }

  const apiBase = getApiBase();
  const url = `${apiBase}/animelist?letter=${encodeURIComponent(letter)}&page=${encodeURIComponent(page)}`;

  const result = await safeFetchJson<Record<string, unknown>>(
    url,
    { next: { revalidate: 300 } },
    {
      cacheKey: `animelist:${letter}:${page}`,
      ttlMs: 1000 * 60 * 5,
      errorTtlMs: 1000 * 30,
    }
  );

  const headers = new Headers();
  if (result.meta?.rateLimitWaitMs) {
    headers.set("x-animix-rate-limit-wait", String(result.meta.rateLimitWaitMs));
  }
  if (typeof result.meta?.rateLimitUsed === "number") {
    headers.set("x-animix-rate-limit-used", String(result.meta.rateLimitUsed));
  }
  if (typeof result.meta?.rateLimitLimit === "number") {
    headers.set("x-animix-rate-limit-limit", String(result.meta.rateLimitLimit));
  }
  if (typeof result.meta?.rateLimitWindowMs === "number") {
    headers.set("x-animix-rate-limit-window", String(result.meta.rateLimitWindowMs));
  }

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502, headers });
  }

  return Response.json(result.data, { headers });
}
