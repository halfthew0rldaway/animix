import { NextRequest } from "next/server";
import { getApiBase, safeFetchJson } from "../../libs/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return Response.json({ error: "Missing slug" }, { status: 400 });
  }

  let apiBase = getApiBase();
  const decodedSlug = decodeURIComponent(slug)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/walka¼re/gi, "walkure");

  let url = `${apiBase}/episode/${encodeURIComponent(decodedSlug)}`;
  const isSamehadaku = decodedSlug.startsWith("smhd::");

  if (isSamehadaku) {
    const actualSlug = decodedSlug.slice(6);
    const secondaryBase = process.env.NEXT_PUBLIC_SECONDARY_API_URL?.replace(/\/+$/, "") ?? "";
    url = `${secondaryBase}/episode/${encodeURIComponent(actualSlug)}`;
  }

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

  const result = await safeFetchJson<any>(
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

  let outputData = result.data;
  if (isSamehadaku && outputData?.data) {
    const epData = outputData.data;
    const streams: { name: string; url: string }[] = [];
    if (epData.defaultStreamingUrl) {
      streams.push({ name: "Default HD", url: epData.defaultStreamingUrl });
    }

    if (epData.server?.qualities && Array.isArray(epData.server.qualities)) {
      const serverIdsToFetch: { name: string; id: string }[] = [];
      for (const q of epData.server.qualities) {
        if (q.serverList && q.serverList.length > 0) {
          const server = q.serverList.find((s: any) =>
            s.title.toLowerCase().includes('mega') ||
            s.title.toLowerCase().includes('vidhide') ||
            s.title.toLowerCase().includes('pucuk')
          ) || q.serverList[0];

          let cleanName = server.title.replace(q.title, "").trim();
          if (!cleanName) cleanName = server.title;
          serverIdsToFetch.push({ name: `${q.title} (${cleanName})`, id: server.serverId });
        }
      }

      const secondaryBase = process.env.NEXT_PUBLIC_SECONDARY_API_URL?.replace(/\/+$/, "") ?? "";
      if (secondaryBase) {
        const fetchPromises = serverIdsToFetch.slice(-4).map(async (srv) => {
          const srvUrl = `${secondaryBase}/server/${srv.id}`;
          try {
            const res = await safeFetchJson<any>(
              srvUrl,
              { next: { revalidate: 3600 }, headers: requestHeaders },
              { cacheKey: `server:${srv.id}`, ttlMs: 1000 * 60 * 60, errorTtlMs: 1000 * 30 }
            );
            if (res.ok && res.data?.data?.url) {
              return { name: srv.name, url: res.data.data.url };
            }
          } catch {
            // Ignore fetch errors
          }
          return null;
        });

        const fetchedStreams = await Promise.all(fetchPromises);
        for (const s of fetchedStreams) {
          if (s && !streams.some(existing => existing.url === s.url)) {
            streams.push(s);
          }
        }
      }
    }

    outputData = {
      title: epData.title || "",
      streams: streams.length > 0 ? streams : undefined,
    };
  }

  return Response.json(outputData, { headers: resHeaders });
}
