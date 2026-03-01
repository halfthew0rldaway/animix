import { NextRequest } from "next/server";
import { safeFetchJson } from "../../../libs/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get("slug") ?? "";
    if (!slug) {
        return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    const result = await safeFetchJson<any>(
        `https://www.sankavollerei.com/anime/donghua/episode/${encodeURIComponent(slug)}`,
        { next: { revalidate: 300 } },
        {
            cacheKey: `donghua-episode:${slug}`,
            ttlMs: 300000,
            errorTtlMs: 20000,
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

    // Map Sankavollerei response to our expected format
    const streamMap = result.data?.streaming?.servers || [];
    if (result.data?.streaming?.main_url?.url) {
        streamMap.unshift(result.data.streaming.main_url);
    }

    const parsedData = {
        title: result.data?.episode || "Episode Donghua",
        streams: streamMap.map((s: any) => ({ name: s.name, url: s.url }))
    };

    return Response.json(parsedData, { headers });
}
