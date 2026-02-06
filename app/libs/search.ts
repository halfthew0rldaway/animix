import Fuse from "fuse.js";
import { safeFetchJson } from "./api";

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
  data?: { animes?: AnimeItem[] };
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
  Number(process.env.SEARCH_MAX_REMOTE_QUERIES ?? "") || 3;
const LETTERS = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const cache: SearchIndexCache = {
  items: [],
  builtAt: 0,
  building: null,
  fuse: null,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractAnimes = (payload: AnimeListResponse): AnimeItem[] => {
  return (
    payload.animes ?? payload.result?.animes ?? payload.data?.animes ?? []
  );
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

  return variants;
};

const createFuse = (items: AnimeItem[]) => {
  return new Fuse(items, {
    keys: [
      { name: "title", weight: 0.8 },
      { name: "slug", weight: 0.2 },
    ],
    threshold: 0.32,
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

const buildRemoteQueries = (rawQuery: string, normalized: string) => {
  const queries = new Set<string>();
  if (rawQuery.trim()) queries.add(rawQuery.trim());
  if (normalized) queries.add(normalized);

  const slugLike = normalized.replace(/\s+/g, "-");
  if (slugLike) queries.add(slugLike);

  for (const variant of expandQueryVariants(normalized)) {
    queries.add(variant);
    const variantSlug = variant.replace(/\s+/g, "-");
    if (variantSlug) queries.add(variantSlug);
  }

  return Array.from(queries).slice(0, MAX_REMOTE_QUERIES);
};

const remoteSearch = async (apiBase: string, query: string) => {
  const payload = await fetchJson<AnimeListResponse>(
    `${apiBase}/search/${encodeURIComponent(query)}`
  );

  return payload ? extractAnimes(payload) : [];
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

  const hasIndex =
    cache.items.length > 0 && Date.now() - cache.builtAt < INDEX_TTL_MS;

  if (SEARCH_ENABLE_INDEX && !hasIndex && !cache.building) {
    void ensureIndex(apiBase);
  }

  const remoteQueries = buildRemoteQueries(raw, normalized);
  const remoteResultsList = await Promise.all(
    remoteQueries.map((term) => remoteSearch(apiBase, term))
  );
  const remoteResults = mergeBySlug(
    remoteResultsList[0] ?? [],
    remoteResultsList.slice(1).flat()
  );

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
