/* eslint-disable @typescript-eslint/no-explicit-any */
// Manga API utilities using Sankavollerei API (or custom API via env)
// Rate limiting applied similar to anime API

import { safeFetchJson } from "./api";

// Allow custom manga API via environment variable
// Default to Sankavollerei (using www subdomain, not api subdomain)
const MANGA_API_BASE = process.env.NEXT_PUBLIC_MANGA_API_URL || "https://www.sankavollerei.com/comic";

console.log('[Manga API] Using base URL:', MANGA_API_BASE);

export type MangaItem = {
    id: string;
    title: string;
    cover: string;
    description?: string;
    status?: string;
    type?: string;
    rating?: string;
    author?: string;
    genres?: string[];
    slug: string;
};

export type ChapterItem = {
    id: string;
    title: string;
    chapter: string;
    slug: string;
    releaseDate?: string;
};

export type ChapterPages = {
    images: string[];
    title: string;
    chapter: string;
};

// Fetch popular manga
export async function fetchPopularManga(limit = 20): Promise<MangaItem[]> {
    try {
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/populer`,
            { next: { revalidate: 3600 } }
        );

        console.log('[Manga API] Popular response:', {
            ok: response.ok,
            hasData: response.ok ? !!response.data : false,
            dataKeys: response.ok && response.data ? Object.keys(response.data) : [],
            error: !response.ok ? response.error : null
        });

        if (!response.ok) {
            console.error('[Manga API] Popular fetch failed:', response.error);
            return [];
        }

        // Sankavollerei API returns data.comics, not data.data
        const comics = response.data?.comics || [];

        if (comics.length === 0) {
            console.warn('[Manga API] No comics in response');
            return [];
        }

        const filtered = comics.filter((item: any) => isMangaSource(item));
        console.log(`[Manga API] Filtered ${filtered.length} manga from ${comics.length} total`);

        return filtered
            .slice(0, limit)
            .map((item: any) => parseMangaItem(item));
    } catch (error) {
        console.error('[Manga API] Popular manga error:', error);
        return [];
    }
}

// Fetch latest manga
export async function fetchLatestManga(limit = 20): Promise<MangaItem[]> {
    try {
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/terbaru?page=1`,
            { next: { revalidate: 600 } }
        );

        console.log('[Manga API] Latest response:', {
            ok: response.ok,
            hasData: response.ok ? !!response.data : false,
            dataKeys: response.ok && response.data ? Object.keys(response.data) : [],
            error: !response.ok ? response.error : null
        });

        if (!response.ok) {
            console.error('[Manga API] Latest fetch failed:', response.error);
            return [];
        }

        // Sankavollerei API returns data.comics
        const comics = response.data?.comics || [];

        if (comics.length === 0) {
            console.warn('[Manga API] No comics in latest response');
            return [];
        }

        const filtered = comics.filter((item: any) => isMangaSource(item));

        return filtered
            .slice(0, limit)
            .map((item: any) => parseMangaItem(item));
    } catch (error) {
        console.error('[Manga API] Latest manga error:', error);
        return [];
    }
}

// Search manga
export async function searchManga(query: string, limit = 20): Promise<MangaItem[]> {
    try {
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/search?q=${encodeURIComponent(query)}`,
            { next: { revalidate: 600 } }
        );

        if (!response.ok) {
            // Fallback to advanced search if basic search fails
            return advancedSearchManga(query, limit);
        }

        // Sankavollerei API returns data.comics
        const comics = response.data?.comics || [];

        if (comics.length === 0) {
            // Fallback to advanced search if basic search returns empty
            return advancedSearchManga(query, limit);
        }

        return comics
            .filter((item: any) => isMangaSource(item))
            .slice(0, limit)
            .map((item: any) => parseMangaItem(item));
    } catch (e) {
        console.error("Search error", e);
        return [];
    }
}

// Advanced Search
export async function advancedSearchManga(query: string, limit = 20): Promise<MangaItem[]> {
    try {
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/advanced-search?q=${encodeURIComponent(query)}&type=manga&limit=${limit}`,
            { next: { revalidate: 600 } }
        );

        if (!response.ok) return [];

        const comics = response.data?.comics || response.data?.data || [];

        return comics
            .map((item: any) => parseMangaItem(item))
            .slice(0, limit);
    } catch (error) {
        console.error("Advanced search error", error);
        return [];
    }
}

// Fetch Manga Library (Pustaka)
// Fetch Manga Library (Using Unlimited Cache for A-Z)
export async function fetchMangaLibrary(page = 1, _limit = 50, letter?: string): Promise<{ items: MangaItem[], hasNext: boolean }> {
    try {
        // Fetch full library (cached for 1 hour)
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/unlimited`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            console.error('[Manga API] Library fetch failed:', response.error);
            return { items: [], hasNext: false };
        }

        let comics = response.data?.comics || response.data?.results || response.data?.data || [];

        // 1. Filter out garbage (APKs, Downloads) as per user request
        comics = comics.filter((item: any) =>
            !item.title?.toLowerCase().includes('apk') &&
            !item.chapter?.toLowerCase().includes('download')
        );

        // 2. Filter by Letter (A-Z) if provided
        if (letter) {
            if (letter === "0-9") {
                comics = comics.filter((item: any) => /^[0-9]/.test(item.title));
            } else {
                comics = comics.filter((item: any) =>
                    item.title?.toUpperCase().startsWith(letter.toUpperCase())
                );
            }
        }

        // 3. Pagination (Slice the in-memory array)
        const total = comics.length;
        const start = (page - 1) * _limit;
        const end = start + _limit;
        const sliced = comics.slice(start, end);
        const hasNext = end < total;

        // 4. Parse Items
        const parsedItems = sliced.map((item: any) => {
            // Robust slug generation from user's snippet logic
            const slug = item.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            // Image fallback logic
            let imageUrl = item.image;
            if (imageUrl && imageUrl.includes('lazy.jpg')) {
                imageUrl = item.thumbnail || "/placeholder-manga.svg";
            }

            return {
                id: slug,
                title: item.title || "Untitled",
                cover: imageUrl || "/placeholder-manga.svg",
                description: item.desc || "",
                status: "Ongoing",
                type: "Manga", // Endpoint usually returns mixed but user wants list
                rating: "",
                slug: slug,
                genres: []
            };
        });

        return {
            items: parsedItems,
            hasNext
        };
    } catch (error) {
        console.error('[Manga API] Library error:', error);
        return { items: [], hasNext: false };
    }
}

// Fetch Unlimited Manga (Deep Crawl)
export async function fetchUnlimitedManga(type = 'all', maxPages = 3): Promise<MangaItem[]> {
    try {
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/unlimited?type=${type}&max_pages=${maxPages}`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            console.error('[Manga API] Unlimited fetch failed:', response.error);
            return [];
        }

        // Response structure might vary, assume similar to others or check docs
        // Docs say: "Akses maksimum ke ribuan komik"
        // Most likely returns a list in data or results
        const comics = response.data?.results || response.data?.comics || response.data?.data || [];

        return comics.map((item: any) => parseMangaItem(item));
    } catch (error) {
        console.error('[Manga API] Unlimited error:', error);
        return [];
    }
}

// Get manga detail
export async function getMangaDetail(slug: string): Promise<MangaItem | null> {
    try {
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/comic/${slug}`,
            { next: { revalidate: 3600 } }
        );

        console.log('[Manga API] Detail response for', slug, ':', {
            ok: response.ok,
            hasData: response.ok ? !!response.data : false,
            dataKeys: response.ok && response.data ? Object.keys(response.data) : [],
        });

        if (!response.ok) {
            console.error('[Manga API] Detail fetch failed:', response.error);
            return null;
        }

        // Sankavollerei API might return data.comic or data directly
        const comicData = response.data?.comic || response.data?.data || response.data;

        if (!comicData) {
            console.warn('[Manga API] No comic data in detail response');
            return null;
        }

        // Log cover-related fields
        console.log('[Manga API] Cover fields for', slug, ':', {
            image: comicData.image,
            thumbnail: comicData.thumbnail,
            cover: comicData.cover,
            coverImage: comicData.coverImage,
            cover_image: comicData.cover_image,
        });

        const parsed = parseMangaDetailItem(comicData, slug);
        console.log('[Manga API] Parsed cover for', slug, ':', parsed.cover);

        return parsed;
    } catch (error) {
        console.error('[Manga API] Detail error:', error);
        return null;
    }
}

// Get manga chapters
export async function getMangaChapters(slug: string): Promise<ChapterItem[]> {
    try {
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/comic/${slug}`,
            { next: { revalidate: 600 } }
        );

        console.log('[Manga API] Chapters response:', {
            ok: response.ok,
            hasData: response.ok ? !!response.data : false,
            dataKeys: response.ok && response.data ? Object.keys(response.data) : [],
        });

        if (!response.ok) {
            console.error('[Manga API] Chapters fetch failed:', response.error);
            return [];
        }

        // Sankavollerei API might return chapters in data.chapters or data.comic.chapters
        const chapters = response.data?.chapters || response.data?.comic?.chapters || response.data?.data?.chapters || [];

        if (chapters.length === 0) {
            console.warn('[Manga API] No chapters found for', slug);
            return [];
        }

        return chapters
            .map((item: any, index: number) => {
                // Extract segment from link (e.g., "/manga/virus-girlfriend/chapter-1/" -> "manga/virus-girlfriend/chapter-1")
                let segment = '';
                if (item.link) {
                    // Remove leading/trailing slashes and extract the path
                    segment = item.link.replace(/^\/+|\/+$/g, '').replace(/^https?:\/\/[^\/]+\//, '');
                } else if (item.slug) {
                    segment = item.slug;
                } else {
                    segment = `chapter-${index}`;
                }

                return {
                    id: segment,
                    title: item.title || `Chapter ${item.chapter || index + 1}`,
                    chapter: item.chapter || String(index + 1),
                    slug: segment, // Use segment as slug for the reader
                    releaseDate: item.date || item.releaseDate,
                };
            })
            .reverse(); // Show latest first
    } catch (error) {
        console.error('[Manga API] Chapters error:', error);
        return [];
    }
}

// Get chapter pages
export async function getChapterPages(chapterSlug: string): Promise<ChapterPages> {
    try {
        // The chapterSlug might be the full segment or just the slug
        // We need to pass it as the segment parameter
        const response = await safeFetchJson<any>(
            `${MANGA_API_BASE}/chapter/${chapterSlug}`,
            { next: { revalidate: 3600 } }
        );

        console.log('[Manga API] Chapter pages response:', {
            ok: response.ok,
            hasData: response.ok ? !!response.data : false,
            dataKeys: response.ok && response.data ? Object.keys(response.data) : [],
        });

        if (!response.ok) {
            console.error('[Manga API] Chapter pages fetch failed:', response.error);
            return { images: [], title: "", chapter: "" };
        }

        const data = response.data;

        return {
            images: data.images || [],
            title: data.title || data.comic_title || "",
            chapter: data.chapter || data.chapter_number || "",
        };
    } catch (error) {
        console.error('[Manga API] Chapter pages error:', error);
        return { images: [], title: "", chapter: "" };
    }
}

// Helper: Check if source is manga (not manhwa/manhua)
function isMangaSource(item: any): boolean {
    const type = (item.type || "").toLowerCase();
    const title = (item.title || "").toLowerCase();

    // Filter out manhwa and manhua
    if (type.includes("manhwa") || type.includes("manhua")) return false;
    if (title.includes("manhwa") || title.includes("manhua")) return false;

    // Accept manga or unspecified
    return true;
}

// Helper: Parse manga list item
function parseMangaItem(item: any): MangaItem {
    // Extract slug
    let slug = "";
    if (item.slug) {
        slug = item.slug;
    } else if (item.link) {
        slug = item.link.split('/').filter((part: string) => part && part !== 'manga').pop() || "";
    } else if (item.detailUrl) {
        // e.g. /detail-komik/slug
        slug = item.detailUrl.split('/').filter((part: string) => part && part !== 'detail-komik').pop() || "";
    } else if (item.url) {
        slug = item.url.split('/').filter((part: string) => part && part !== 'manga').pop() || "";
    }

    // Fallback if extracting from URL fails
    if (!slug) {
        slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Enhanced cover selection
    const pickBestCover = () => {
        // Try to get all possible cover fields
        const candidates = [
            item.coverImage,
            item.cover_image,
            item.poster,
            item.posterImage,
            item.image,
            item.image_url,
            item.coverUrl,
            item.cover_url,
            item.cover,
            item.thumbnail,
        ].filter(Boolean);

        if (candidates.length === 0) return "/placeholder-manga.svg";

        // Filter out lazy.jpg and other low-quality indicators
        let bestCover = candidates[0];

        for (const candidate of candidates) {
            if (!candidate) continue;

            const lowerCandidate = candidate.toLowerCase();
            const lowerBest = bestCover.toLowerCase();

            // Skip lazy.jpg
            if (lowerCandidate.includes('lazy.jpg')) continue;

            // Prefer non-thumbnail URLs
            if (lowerBest.includes('thumbnail') && !lowerCandidate.includes('thumbnail')) {
                bestCover = candidate;
                continue;
            }

            // Upgrade thumbnail.komiku.org to img.komiku.org
            if (lowerCandidate.includes('thumbnail.komiku.org')) {
                bestCover = candidate.replace('thumbnail.komiku.org', 'img.komiku.org');
                continue;
            }

            // Remove resize query params
            if (lowerCandidate.includes('?resize=')) {
                bestCover = candidate.split('?')[0];
                continue;
            }

            // Prefer larger images based on URL hints
            if (lowerCandidate.includes('large') || lowerCandidate.includes('original')) {
                bestCover = candidate;
                continue;
            }
        }

        // Final URL cleanup
        let finalCover = bestCover;
        if (finalCover.includes('thumbnail.komiku.org')) {
            finalCover = finalCover.replace('thumbnail.komiku.org', 'img.komiku.org');
        }
        if (finalCover.includes('?resize=')) {
            finalCover = finalCover.split('?')[0];
        }

        return finalCover || "/placeholder-manga.svg";
    };

    return {
        id: slug,
        title: item.title || "Untitled",
        cover: pickBestCover(),
        description: item.synopsis || item.description || "",
        status: item.status || "",
        type: item.type || "Manga",
        rating: item.rating || "",
        slug: slug,
        genres: item.genres || [],
    };
}

// Helper: Parse manga detail item
function parseMangaDetailItem(item: any, slug: string): MangaItem {
    // Parse genres - they might be objects with {name, slug, link} or just strings
    let genres: string[] = [];
    if (item.genres && Array.isArray(item.genres)) {
        genres = item.genres.map((g: any) =>
            typeof g === 'string' ? g : g.name || g
        );
    }

    // Enhanced cover selection (same as parseMangaItem)
    const pickBestCover = () => {
        const candidates = [
            item.coverImage,
            item.cover_image,
            item.poster,
            item.posterImage,
            item.image,
            item.image_url,
            item.coverUrl,
            item.cover_url,
            item.cover,
            item.thumbnail,
        ].filter(Boolean);

        if (candidates.length === 0) return "/placeholder-manga.svg";

        let bestCover = candidates[0];

        for (const candidate of candidates) {
            if (!candidate) continue;

            const lowerCandidate = candidate.toLowerCase();
            const lowerBest = bestCover.toLowerCase();

            if (lowerCandidate.includes('lazy.jpg')) continue;

            if (lowerBest.includes('thumbnail') && !lowerCandidate.includes('thumbnail')) {
                bestCover = candidate;
                continue;
            }

            if (lowerCandidate.includes('thumbnail.komiku.org')) {
                bestCover = candidate.replace('thumbnail.komiku.org', 'img.komiku.org');
                continue;
            }

            if (lowerCandidate.includes('?resize=')) {
                bestCover = candidate.split('?')[0];
                continue;
            }

            if (lowerCandidate.includes('large') || lowerCandidate.includes('original')) {
                bestCover = candidate;
                continue;
            }
        }

        let finalCover = bestCover;
        if (finalCover.includes('thumbnail.komiku.org')) {
            finalCover = finalCover.replace('thumbnail.komiku.org', 'img.komiku.org');
        }
        if (finalCover.includes('?resize=')) {
            finalCover = finalCover.split('?')[0];
        }

        return finalCover || "/placeholder-manga.svg";
    };

    return {
        id: slug,
        title: item.title || "Untitled",
        cover: pickBestCover(),
        description: item.synopsis || item.description || "",
        status: item.metadata?.status || item.status || "",
        type: item.metadata?.type || item.type || "Manga",
        rating: item.rating || "",
        author: item.metadata?.author || item.author || item.creator || "",
        genres: genres,
        slug: slug,
    };
}
