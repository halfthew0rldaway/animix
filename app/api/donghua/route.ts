import { NextRequest } from "next/server";
import { safeFetchJson } from "../../libs/api";

export const runtime = "nodejs";

type ApiDonghuaItem = Record<string, unknown>;

type ApiListResponse = {
    status?: string;
    creator?: string;
    ongoing_donghua?: ApiDonghuaItem[];
    completed_donghua?: ApiDonghuaItem[];
};

const normalize = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const pickSlug = (item: ApiDonghuaItem, title: string) => {
    const slug =
        (item.slug as string | undefined) ??
        (item.animeId as string | undefined) ??
        (item.id as string | undefined);

    if (slug) {
        // Some slugs have trailing slash, let's remove it
        return slug.replace(/\/+$/, "");
    }
    return normalize(title).replace(/\s+/g, "-");
};

const pickPoster = (item: ApiDonghuaItem) =>
    (item.poster as string | undefined) ??
    (item.image as string | undefined) ??
    (item.thumbnail as string | undefined) ??
    (item.cover as string | undefined) ??
    (item.posterImage as string | undefined) ??
    "";

const pickTitle = (item: ApiDonghuaItem) =>
    (item.title as string | undefined) ??
    (item.name as string | undefined) ??
    (item.animeTitle as string | undefined) ??
    "Untitled";

const pickEpisode = (item: ApiDonghuaItem) =>
    (item.episode as string | number | undefined) ??
    (item.episodes as string | number | undefined) ??
    (item.latestEpisode as string | number | undefined) ??
    null;

const pickType = (item: ApiDonghuaItem) =>
    (item.type as string | undefined) ??
    (item.format as string | undefined) ??
    null;

const pickReleaseDay = (item: ApiDonghuaItem) =>
    (item.release_day as string | undefined) ??
    (item.releaseDay as string | undefined) ??
    (item.day as string | undefined) ??
    null;

const pickSynopsis = (item: ApiDonghuaItem) =>
    (item.synopsis as string | undefined) ??
    (item.description as string | undefined) ??
    null;

const pickStudio = (item: ApiDonghuaItem) =>
    (item.studio as string | undefined) ??
    (item.studios as string | undefined) ??
    null;

export async function GET(req: NextRequest) {
    const pageParam = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const typeParam = (req.nextUrl.searchParams.get("type") ?? "ongoing").toLowerCase();

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const endpoint = typeParam === "completed" ? "completed" : "ongoing";

    const API_BASE = "https://www.sankavollerei.com/anime/donghua";
    const url = `${API_BASE}/${endpoint}?page=${encodeURIComponent(page)}`;

    const result = await safeFetchJson<ApiListResponse>(
        url,
        { next: { revalidate: 300 } },
        {
            cacheKey: `donghua-feed:${endpoint}:${page}`,
            ttlMs: 1000 * 60 * 5,
            errorTtlMs: 1000 * 30,
        }
    );

    if (!result.ok) {
        return Response.json({ error: result.error }, { status: 502 });
    }

    // Pick list based on the endpoint
    const list = endpoint === "ongoing"
        ? (result.data.ongoing_donghua ?? [])
        : (result.data.completed_donghua ?? []);

    const items = list.map((item) => {
        const title = pickTitle(item);
        return {
            slug: pickSlug(item, title),
            title,
            poster: pickPoster(item),
            episode: pickEpisode(item),
            type: pickType(item) ?? "Donghua",
            release_day: pickReleaseDay(item),
            synopsis: pickSynopsis(item),
            studio: pickStudio(item),
        };
    });

    // Since there is no pagination data, assume true if we have items
    const hasNextPage = items.length > 0;

    return Response.json({ items, hasNextPage });
}
