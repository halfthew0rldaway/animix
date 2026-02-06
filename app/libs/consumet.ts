import { safeFetchJson } from "./api";

type HiAnimeSearchResult = {
  id: string;
  title: string;
  image?: string;
};

type HiAnimeSearchResponse = {
  results?: HiAnimeSearchResult[];
};

export type HiAnimeInfo = {
  id: string;
  title: string;
  alID?: number;
  malID?: number;
  image?: string;
  description?: string;
  genres?: string[];
  status?: string;
  season?: string;
  totalEpisodes?: number;
  episodes?: Array<{ id: string; number: number; title?: string }>;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pickBestMatch = (query: string, results: HiAnimeSearchResult[]) => {
  if (results.length === 0) return null;
  const normQuery = normalize(query);
  let best = results[0];
  let bestScore = -1;

  for (const item of results) {
    const normTitle = normalize(item.title ?? "");
    if (!normTitle) continue;
    if (normTitle === normQuery) {
      return item;
    }
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

export async function fetchHiAnimeInfoByTitle(title: string) {
  const base = process.env.CONSUMET_BASE_URL;
  if (!base) return null;

  const provider = process.env.CONSUMET_ANIME_PROVIDER ?? "hianime";
  const searchUrl = `${base}/anime/${provider}/${encodeURIComponent(title)}`;
  const search = await safeFetchJson<HiAnimeSearchResponse>(
    searchUrl,
    { next: { revalidate: 3600 } },
    { cacheKey: `consumet-search:${provider}:${title}`, ttlMs: 1000 * 60 * 60 }
  );

  if (!search.ok || !search.data?.results?.length) return null;
  const match = pickBestMatch(title, search.data.results);
  if (!match?.id) return null;

  const infoUrl = `${base}/anime/${provider}/info/${encodeURIComponent(match.id)}`;
  const info = await safeFetchJson<HiAnimeInfo>(
    infoUrl,
    { next: { revalidate: 3600 } },
    { cacheKey: `consumet-info:${provider}:${match.id}`, ttlMs: 1000 * 60 * 60 }
  );

  if (!info.ok) return null;
  return info.data;
}
