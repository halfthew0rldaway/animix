import { NextRequest } from "next/server";
import { getApiBase, safeFetchJson } from "../../libs/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return Response.json({ error: "Missing slug" }, { status: 400 });
  }

  const apiBase = getApiBase();
  const url = `${apiBase}/episode/${encodeURIComponent(slug)}`;
  const origin = process.env.API_ORIGIN || new URL(apiBase).origin;
  const referer = process.env.API_REFERER || `${origin}/`;
  const requestHeaders = {
    "User-Agent":
      process.env.API_USER_AGENT ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    Accept: "application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: referer,
    Origin: origin,
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
  };

  const result = await safeFetchJson<Record<string, unknown>>(
    url,
    { next: { revalidate: 60 }, headers: requestHeaders },
    { cacheKey: `episode:${slug}`, ttlMs: 1000 * 60, errorTtlMs: 1000 * 10 }
  );

  const resHeaders = new Headers();
  if (result.meta?.rateLimitWaitMs) {
    resHeaders.set(
      "x-animix-rate-limit-wait",
      String(result.meta.rateLimitWaitMs)
    );
  }
  if (typeof result.meta?.rateLimitUsed === "number") {
    resHeaders.set("x-animix-rate-limit-used", String(result.meta.rateLimitUsed));
  }
  if (typeof result.meta?.rateLimitLimit === "number") {
    resHeaders.set("x-animix-rate-limit-limit", String(result.meta.rateLimitLimit));
  }
  if (typeof result.meta?.rateLimitWindowMs === "number") {
    resHeaders.set(
      "x-animix-rate-limit-window",
      String(result.meta.rateLimitWindowMs)
    );
  }

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502, headers: resHeaders });
  }

  return Response.json(result.data, { headers: resHeaders });
}
