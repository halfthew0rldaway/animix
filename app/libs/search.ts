import Fuse from "fuse.js";
import { safeFetchJson } from "./api";
import { fetchAniListByTitle } from "./anilist";

export type AnimeItem = {
  slug: string;
  title: string;
  poster: string;
  episode?: string | number | null;
  type?: string | null;
  release_day?: string | null;
};

type AnimeListResponse = {
  animes?: AnimeItem[];
  result?: { animes?: AnimeItem[] };
  data?: AnimeItem[] | { animes?: AnimeItem[] };
};

// Samehadaku search returns { data: { animeList: [...] } }
// Each item uses 'animeId' as the slug field
type SamehadakuAnimeItem = {
  title: string;
  animeId: string;
  poster: string;
  episode?: string | number | null;
  type?: string | null;
};
type SamehadakuSearchResponse = {
  data?: {
    animeList?: SamehadakuAnimeItem[];
    animes?: AnimeItem[];
  } | AnimeItem[];
  animes?: AnimeItem[];
  result?: { animes?: AnimeItem[] };
};

type SearchIndexCache = {
  items: AnimeItem[];
  builtAt: number;
  building: Promise<AnimeItem[]> | null;
  fuse: Fuse<AnimeItem> | null;
};

const SEARCH_ENABLE_INDEX = (process.env.SEARCH_ENABLE_INDEX ?? "false") === "true";
const INDEX_TTL_MS =
  Number(process.env.SEARCH_INDEX_TTL_MS ?? "") || 1000 * 60 * 60 * 6;
const MAX_PAGES_PER_LETTER =
  Number(process.env.SEARCH_MAX_PAGES_PER_LETTER ?? "") || 200;
const MAX_ITEMS = Number(process.env.SEARCH_MAX_ITEMS ?? "") || 60000;
const WAIT_FOR_INDEX_MS = Number(process.env.SEARCH_INDEX_WAIT_MS ?? "") || 1200;
const REQUEST_DELAY_MS =
  Number(process.env.SEARCH_INDEX_DELAY_MS ?? "") || 300;
const MAX_REQUESTS =
  Number(process.env.SEARCH_MAX_REQUESTS ?? "") || 1500;
const MAX_REMOTE_QUERIES =
  Number(process.env.SEARCH_MAX_REMOTE_QUERIES ?? "") || 4;
const LETTERS = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const cache: SearchIndexCache = {
  items: [],
  builtAt: 0,
  building: null,
  fuse: null,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractAnimes = (payload: AnimeListResponse): AnimeItem[] => {
  if (payload.animes) return payload.animes;
  if (payload.result?.animes) return payload.result.animes;
  if (Array.isArray(payload.data)) return payload.data as AnimeItem[];
  if (payload.data && !Array.isArray(payload.data) && payload.data.animes) return payload.data.animes;
  return [];
};

const extractSamehadakuAnimes = (payload: SamehadakuSearchResponse): AnimeItem[] => {
  const data = payload.data;
  // Primary shape: { data: { animeList: [ { animeId, title, poster, type } ] } }
  if (data && !Array.isArray(data) && Array.isArray((data as { animeList?: unknown }).animeList)) {
    const list = (data as { animeList: SamehadakuAnimeItem[] }).animeList;
    return list.map((item) => ({
      slug: `smhd::${item.animeId}`,
      title: item.title,
      poster: item.poster,
      episode: item.episode ?? null,
      type: item.type ?? null,
    }));
  }
  // Fallback shapes
  if (Array.isArray(data)) return data as AnimeItem[];
  if (payload.animes) return payload.animes;
  if (payload.result?.animes) return payload.result.animes;
  return [];
};

const normalizeQuery = (query: string) => {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const expandQueryVariants = (query: string) => {
  const variants = new Set<string>();
  if (!query) return variants;

  variants.add(query);

  const cleaned = query
    .replace(/\b(sub|dub|subbed|season|part|movie)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned && cleaned !== query) {
    variants.add(cleaned);
  }

  const seasonMatch = query.match(/\bseason\s+(\d+)\b/);
  if (seasonMatch) {
    const season = seasonMatch[1];
    variants.add(query.replace(/\bseason\s+\d+\b/, `s${season}`));
  }

  const sMatch = query.match(/\bs(\d+)\b/);
  if (sMatch) {
    const season = sMatch[1];
    variants.add(query.replace(/\bs\d+\b/, `season ${season}`));
  }

  // Add first meaningful word for APIs that match better on short keywords
  const words = query.replace(/\b(no|the|of|a|an|to|in|on|and|or)\b/gi, " ").trim().split(/\s+/);
  if (words.length > 1 && words[0].length >= 4) {
    variants.add(words[0]);
  }

  return variants;
};

const createFuse = (items: AnimeItem[]) => {
  return new Fuse(items, {
    keys: [
      { name: "title", weight: 0.8 },
      { name: "slug", weight: 0.2 },
    ],
    threshold: 0.45,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });
};

const fetchJson = async <T,>(url: string): Promise<T | null> => {
  const res = await safeFetchJson<T>(
    url,
    { next: { revalidate: 3600 } },
    { ttlMs: 1000 * 60 * 10, errorTtlMs: 1000 * 30 }
  );
  return res.ok ? res.data : null;
};

const buildIndex = async (apiBase: string): Promise<AnimeItem[]> => {
  const items: AnimeItem[] = [];
  const seen = new Set<string>();
  let requestCount = 0;

  for (const letter of LETTERS) {
    for (let page = 1; page <= MAX_PAGES_PER_LETTER; page += 1) {
      if (requestCount >= MAX_REQUESTS) {
        break;
      }
      if (items.length >= MAX_ITEMS) {
        break;
      }

      const url = `${apiBase}/animelist?letter=${letter}&page=${page}`;
      const payload = await fetchJson<AnimeListResponse>(url);
      requestCount += 1;
      const pageItems = payload ? extractAnimes(payload) : [];

      if (!pageItems.length) {
        break;
      }

      for (const item of pageItems) {
        if (!seen.has(item.slug)) {
          seen.add(item.slug);
          items.push(item);
        }
      }

      if (REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    }
  }

  cache.items = items;
  cache.builtAt = Date.now();
  cache.fuse = createFuse(items);

  return items;
};

const ensureIndex = async (apiBase: string) => {
  if (!SEARCH_ENABLE_INDEX) return cache.items;

  const fresh =
    cache.items.length > 0 && Date.now() - cache.builtAt < INDEX_TTL_MS;

  if (fresh) return cache.items;
  if (cache.building) return cache.building;

  cache.building = buildIndex(apiBase).finally(() => {
    cache.building = null;
  });

  return cache.building;
};

const fuzzySearch = (query: string) => {
  if (!cache.fuse) return [] as AnimeItem[];

  const variants = expandQueryVariants(query);
  const results = new Map<string, { item: AnimeItem; score: number }>();

  for (const term of variants) {
    const found = cache.fuse.search(term, { limit: 60 });
    for (const result of found) {
      const score = result.score ?? 1;
      const prev = results.get(result.item.slug);
      if (!prev || score < prev.score) {
        results.set(result.item.slug, { item: result.item, score });
      }
    }
  }

  return Array.from(results.values())
    .sort((a, b) => a.score - b.score)
    .slice(0, 48)
    .map((entry) => entry.item);
};

const buildRemoteQueries = (rawQuery: string, normalized: string, aniListTitles: string[] = []) => {
  const queries = new Set<string>();

  // High priority: AniList corrected titles
  for (const title of aniListTitles) {
    if (title && title.trim()) {
      queries.add(title.trim());
    }
  }

  if (rawQuery.trim()) queries.add(rawQuery.trim());
  if (normalized) queries.add(normalized);

  const slugLike = normalized.replace(/\s+/g, "-");
  if (slugLike) queries.add(slugLike);

  for (const variant of expandQueryVariants(normalized)) {
    queries.add(variant);
    const variantSlug = variant.replace(/\s+/g, "-");
    if (variantSlug) queries.add(variantSlug);
  }

  return Array.from(queries).slice(0, MAX_REMOTE_QUERIES + 2); // Allow a little more if anilist added titles
};

const remoteSearch = async (apiBase: string, query: string) => {
  const payload = await fetchJson<AnimeListResponse>(
    `${apiBase}/search/${encodeURIComponent(query)}`
  );

  return payload ? extractAnimes(payload) : [];
};

// Samehadaku uses ?q= query param instead of /:keyword path
const remoteSearchSamehadaku = async (apiBase: string, query: string) => {
  const payload = await fetchJson<SamehadakuSearchResponse>(
    `${apiBase}/search?q=${encodeURIComponent(query)}`
  );

  return payload ? extractSamehadakuAnimes(payload) : [];
};

const mergeBySlug = (primary: AnimeItem[], secondary: AnimeItem[]) => {
  const seen = new Set<string>();
  const merged: AnimeItem[] = [];

  for (const item of primary) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      merged.push(item);
    }
  }

  for (const item of secondary) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      merged.push(item);
    }
  }

  return merged;
};

export async function searchAnime(query: string, apiBase: string) {
  const raw = query.trim();
  const normalized = normalizeQuery(raw);
  if (!normalized) return [] as AnimeItem[];

  const secondaryBase = process.env.NEXT_PUBLIC_SECONDARY_API_URL?.replace(/\/+$/, "") ?? null;

  const hasIndex =
    cache.items.length > 0 && Date.now() - cache.builtAt < INDEX_TTL_MS;

  if (SEARCH_ENABLE_INDEX && !hasIndex && !cache.building) {
    void ensureIndex(apiBase);
  }

  const aniListTitles: string[] = [];
  try {
    const aniListMedia = await fetchAniListByTitle(raw);
    if (aniListMedia?.title) {
      if (aniListMedia.title.romaji) aniListTitles.push(aniListMedia.title.romaji);
      if (aniListMedia.title.english) aniListTitles.push(aniListMedia.title.english);
    }
  } catch (err) {
    console.error("AniList search augmentation failed:", err);
  }

  const remoteQueries = buildRemoteQueries(raw, normalized, aniListTitles);

  // Fan out to primary (animasu path-based) and secondary (samehadaku query-param) in parallel
  const [primaryResultsList, secondaryResultsList] = await Promise.all([
    Promise.all(remoteQueries.map((term) => remoteSearch(apiBase, term))),
    secondaryBase
      ? Promise.all(remoteQueries.map((term) => remoteSearchSamehadaku(secondaryBase, term)))
      : Promise.resolve([] as AnimeItem[][]),
  ]);

  const primaryResults = mergeBySlug(
    primaryResultsList[0] ?? [],
    primaryResultsList.slice(1).flat()
  );
  const secondaryResults = mergeBySlug(
    secondaryResultsList[0] ?? [],
    secondaryResultsList.slice(1).flat()
  );

  // Primary results take precedence; secondary fills in missing titles
  const remoteResults = mergeBySlug(primaryResults, secondaryResults);

  if (!hasIndex || !SEARCH_ENABLE_INDEX) {
    if (cache.building && remoteResults.length < 6) {
      await Promise.race([
        cache.building,
        new Promise((resolve) => setTimeout(resolve, WAIT_FOR_INDEX_MS)),
      ]);
    }
    if (cache.fuse) {
      return mergeBySlug(remoteResults, fuzzySearch(normalized));
    }
    return remoteResults;
  }

  return mergeBySlug(remoteResults, fuzzySearch(normalized));
}

export function getIndexStatus() {
  return {
    size: cache.items.length,
    builtAt: cache.builtAt,
    building: Boolean(cache.building),
    enabled: SEARCH_ENABLE_INDEX,
  };
}
