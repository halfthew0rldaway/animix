import { safeFetchJson } from "./api";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export type AniListMedia = {
  id: number;
  idMal?: number | null;
  title?: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
    userPreferred?: string | null;
  };
  bannerImage?: string | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
  };
  description?: string | null;
  seasonYear?: number | null;
  format?: string | null;
};

type AniListResponse = {
  data?: {
    Media?: AniListMedia | null;
    Page?: {
      media?: AniListMedia[] | null;
    } | null;
  };
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pickBestMatch = (query: string, results: AniListMedia[]) => {
  if (!results.length) return null;
  const normQuery = normalize(query);
  let best = results[0];
  let bestScore = -1;

  for (const item of results) {
    const title =
      item.title?.userPreferred ??
      item.title?.english ??
      item.title?.romaji ??
      "";
    const normTitle = normalize(title);
    if (!normTitle) continue;
    if (normTitle === normQuery) return item;
    const score = normQuery
      .split(" ")
      .filter((word) => normTitle.includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best;
};

const MEDIA_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
    userPreferred
  }
  bannerImage
  coverImage {
    extraLarge
    large
  }
  description
  seasonYear
  format
`;

const removeSeasonTokens = (value: string) =>
  value
    .replace(/\bseason\s*\d+\b/gi, " ")
    .replace(/\bs\d+\b/gi, " ")
    .replace(/\bpart\s*\d+\b/gi, " ")
    .replace(/\bcour\s*\d+\b/gi, " ")
    .replace(/\b(2nd|3rd|4th|5th)\s*season\b/gi, " ")
    .replace(/\bsecond\s*season\b/gi, " ")
    .replace(/\bthird\s*season\b/gi, " ")
    .replace(/\bfourth\s*season\b/gi, " ")
    .replace(/\bfifth\s*season\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const removeNoiseTokens = (value: string) =>
  value
    .replace(/\((.*?)\)/g, " ")
    .replace(/\[(.*?)\]/g, " ")
    .replace(/\b(sub|dub|indo|indonesia|subtitle|subbed|dubbed)\b/gi, " ")
    .replace(/\b(tv|movie|ova|ona|special|episode|episodes|eps)\b/gi, " ")
    .replace(/\b(season|part|cour)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildSearchCandidates = (title: string, slug?: string) => {
  const candidates: string[] = [];
  const add = (value: string | null | undefined) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!candidates.includes(trimmed)) {
      candidates.push(trimmed);
    }
  };

  add(title);
  add(removeSeasonTokens(title));
  add(removeNoiseTokens(title));
  add(removeNoiseTokens(removeSeasonTokens(title)));
  add(title.replace(/[^\w\s]/g, " "));
  add(removeSeasonTokens(title.replace(/[^\w\s]/g, " ")));
  add(removeNoiseTokens(title.replace(/[^\w\s]/g, " ")));
  add(removeNoiseTokens(removeSeasonTokens(title.replace(/[^\w\s]/g, " "))));

  if (slug) {
    const slugBase = slug.replace(/-episode-\d+$/, "").replace(/-/g, " ");
    add(slugBase);
    add(removeSeasonTokens(slugBase));
    add(removeNoiseTokens(slugBase));
  }

  return candidates;
};

async function fetchAniListByQuery(queryText: string) {
  const query = `query ($search: String) {\n  Page(perPage: 5) {\n    media(search: $search, type: ANIME) {\n${MEDIA_FIELDS}\n    }\n  }\n}`;
  const res = await safeFetchJson<AniListResponse>(
    ANILIST_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables: { search: queryText } }),
      next: { revalidate: 86400 },
    },
    { cacheKey: `anilist:search:v3:${queryText}`, ttlMs: 1000 * 60 * 60 * 24 }
  );

  if (!res.ok) return null;
  const list = res.data?.data?.Page?.media ?? [];
  return pickBestMatch(queryText, list) ?? null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  if (items.length === 0) return [] as R[];
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await mapper(items[index], index);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

export async function enhanceAnimeImages<
  T extends { title: string; poster: string; banner?: string | null; slug?: string }
>(
  items: T[],
  options?: { limit?: number; concurrency?: number }
) {
  const limit = options?.limit ?? items.length;
  const concurrency = options?.concurrency ?? 6;
  const head = items.slice(0, limit);
  const tail = items.slice(limit);

  const enhanced = await mapWithConcurrency(head, concurrency, async (item) => {
    try {
      const media = await fetchAniListByTitle(item.title, { slug: item.slug });
      if (!media) return item;
      const poster =
        media.coverImage?.extraLarge ??
        media.coverImage?.large ??
        item.poster;
      const banner = media.bannerImage ?? item.banner ?? null;
      return { ...item, poster, banner };
    } catch {
      return item;
    }
  });

  return [...enhanced, ...tail];
}

export async function fetchAniListById(id: number) {
  if (!Number.isFinite(id)) return null;

  const query = `query ($id: Int) {\n  Media(id: $id, type: ANIME) {\n${MEDIA_FIELDS}\n  }\n}`;
  const res = await safeFetchJson<AniListResponse>(
    ANILIST_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables: { id } }),
      next: { revalidate: 86400 },
    },
    { cacheKey: `anilist:id:${id}`, ttlMs: 1000 * 60 * 60 * 24 }
  );

  if (!res.ok) return null;
  return res.data?.data?.Media ?? null;
}

export async function fetchAniListByTitle(
  title: string,
  options?: { slug?: string }
) {
  if (!title) return null;
  const candidates = buildSearchCandidates(title, options?.slug);
  for (const candidate of candidates) {
    const media = await fetchAniListByQuery(candidate);
    if (media) return media;
  }
  return null;
}

export async function fetchAniListTrending(limit = 10) {
  const query = `query ($perPage: Int) {\n  Page(perPage: $perPage, sort: TRENDING_DESC) {\n    media(type: ANIME) {\n${MEDIA_FIELDS}\n    }\n  }\n}`;
  const res = await safeFetchJson<AniListResponse>(
    ANILIST_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables: { perPage: limit } }),
      next: { revalidate: 86400 },
    },
    { cacheKey: `anilist:trending:${limit}`, ttlMs: 1000 * 60 * 60 * 12 }
  );

  if (!res.ok) return [];
  return res.data?.data?.Page?.media ?? [];
}
