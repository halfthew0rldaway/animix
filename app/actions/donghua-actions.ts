"use server";

import { safeFetchJson } from "../libs/api";

export async function fetchDonghuaLibraryAction(letter: string | undefined, page: number) {
    const queryLetter = letter || "A";
    const slug = queryLetter === "0-9" ? "0-9" : queryLetter.toUpperCase();

    // Use proper exact A-Z list endpoint for Donghua
    const url = `https://www.sankavollerei.com/anime/donghua/az-list/${slug}/${page}`;

    // safeFetchJson guarantees consistent rate limiting and proxying
    const res = await safeFetchJson<any>(
        url,
        { next: { revalidate: 300 } },
        { cacheKey: `donghua-az-list-${slug}-${page}`, ttlMs: 300000, errorTtlMs: 20000 }
    );

    if (!res.ok || !res.data) {
        return { items: [], hasNext: false };
    }

    let items = Array.isArray(res.data.donghua_list) ? res.data.donghua_list : [];

    // Normalize properties
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
        // Typically Sankavollerei returns 10 items per page for az-list
        hasNext: items.length >= 10
    };
}
