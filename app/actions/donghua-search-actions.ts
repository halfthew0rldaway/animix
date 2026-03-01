"use server";

import { safeFetchJson } from "../libs/api";

export async function fetchDonghuaSearchAction(query: string, page: number) {
    if (!query) return { items: [], hasNext: false };

    const url = `https://www.sankavollerei.com/anime/donghua/search/${encodeURIComponent(query)}/${page}`;

    const res = await safeFetchJson<any>(
        url,
        { next: { revalidate: 300 } },
        { cacheKey: `donghua-search-${query}-${page}`, ttlMs: 300000, errorTtlMs: 20000 }
    );

    if (!res.ok || !res.data) {
        return { items: [], hasNext: false };
    }

    let items = Array.isArray(res.data.data) ? res.data.data : [];

    items = items.map((item: any) => ({
        slug: item.slug ?? item.animeId ?? item.id ?? item.title.replace(/\s+/g, "-").toLowerCase(),
        title: item.title ?? item.name ?? "Untitled",
        poster: item.poster ?? item.image ?? item.thumbnail ?? item.cover ?? "",
        episode: item.episode ?? item.episodes ?? item.latestEpisode ?? null,
        type: item.type ?? item.format ?? "Donghua",
        release_day: item.release_day ?? item.day ?? null,
        synopsis: item.synopsis ?? item.description ?? null,
        studio: item.studio ?? item.studios ?? null,
    }));

    return {
        items,
        hasNext: items.length >= 10
    };
}
