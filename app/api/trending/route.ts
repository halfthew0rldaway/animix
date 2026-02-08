import { NextRequest } from "next/server";
import { getApiBase, safeFetchJson } from "../../libs/api";

export const runtime = "nodejs";

type ApiAnimeItem = Record<string, unknown>;

type ApiListResponse = {
  animes?: ApiAnimeItem[];
  animeList?: ApiAnimeItem[];
  result?: { animes?: ApiAnimeItem[]; animeList?: ApiAnimeItem[] };
  data?: {
    animes?: ApiAnimeItem[];
    animeList?: ApiAnimeItem[];
    ongoing?: { animeList?: ApiAnimeItem[] };
    completed?: { animeList?: ApiAnimeItem[] };
  };
  ongoing?: { animeList?: ApiAnimeItem[] };
  completed?: { animeList?: ApiAnimeItem[] };
  pagination?: {
    hasNextPage?: boolean | null;
    hasNext?: boolean | null;
    nextPage?: number | null;
  } | null;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pickList = (payload: ApiListResponse): ApiAnimeItem[] => {
  return (
    payload.animes ??
    payload.animeList ??
    payload.result?.animes ??
    payload.result?.animeList ??
    payload.data?.animes ??
    payload.data?.animeList ??
    payload.data?.ongoing?.animeList ??
    payload.data?.completed?.animeList ??
    payload.ongoing?.animeList ??
    payload.completed?.animeList ??
    []
  );
};

const pickSlug = (item: ApiAnimeItem, title: string) => {
  const slug =
    (item.slug as string | undefined) ??
    (item.animeId as string | undefined) ??
    (item.id as string | undefined);
  if (slug) return slug;
  const href = item.href as string | undefined;
  if (href) {
    const trimmed = href.split("?")[0]?.replace(/\/+$/, "");
    const last = trimmed?.split("/").filter(Boolean).pop();
    if (last) return last;
  }
  return normalize(title).replace(/\s+/g, "-");
};

const pickPoster = (item: ApiAnimeItem) =>
  (item.poster as string | undefined) ??
  (item.image as string | undefined) ??
  (item.thumbnail as string | undefined) ??
  (item.cover as string | undefined) ??
  (item.posterImage as string | undefined) ??
  "";

const pickTitle = (item: ApiAnimeItem) =>
  (item.title as string | undefined) ??
  (item.name as string | undefined) ??
  (item.animeTitle as string | undefined) ??
  "Untitled";

const pickEpisode = (item: ApiAnimeItem) =>
  (item.episode as string | number | undefined) ??
  (item.episodes as string | number | undefined) ??
  (item.latestEpisode as string | number | undefined) ??
  null;

const pickType = (item: ApiAnimeItem) =>
  (item.type as string | undefined) ??
  (item.format as string | undefined) ??
  null;

const pickReleaseDay = (item: ApiAnimeItem) =>
  (item.release_day as string | undefined) ??
  (item.releaseDay as string | undefined) ??
  (item.day as string | undefined) ??
  null;

export async function GET(req: NextRequest) {
  const pageParam = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const perPageParam = Number(req.nextUrl.searchParams.get("perPage") ?? "24");
  const typeParam = (req.nextUrl.searchParams.get("type") ?? "").toLowerCase();
  const sortParam = (req.nextUrl.searchParams.get("sort") ?? "").toUpperCase();

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPage = Number.isFinite(perPageParam)
    ? Math.min(Math.max(perPageParam, 6), 36)
    : 24;

  let endpoint = "/ongoing";
  if (typeParam === "completed") endpoint = "/completed";
  if (typeParam === "popular") endpoint = "/popular";
  if (typeParam === "latest") endpoint = "/latest";
  if (!typeParam && sortParam === "POPULARITY_DESC") endpoint = "/popular";
  if (!typeParam && sortParam === "SCORE_DESC") endpoint = "/completed";

  const apiBase = getApiBase();
  const url = `${apiBase}${endpoint}?page=${encodeURIComponent(page)}`;

  const result = await safeFetchJson<ApiListResponse>(
    url,
    { next: { revalidate: 300 } },
    {
      cacheKey: `home-feed:${endpoint}:${page}:${perPage}`,
      ttlMs: 1000 * 60 * 5,
      errorTtlMs: 1000 * 30,
    }
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  const list = pickList(result.data);
  const items = list.map((item) => {
    const title = pickTitle(item);
    return {
      slug: pickSlug(item, title),
      title,
      poster: pickPoster(item),
      episode: pickEpisode(item),
      type: pickType(item),
      release_day: pickReleaseDay(item),
    };
  });

  const hasNextPage =
    Boolean(result.data.pagination?.hasNextPage) ||
    Boolean(result.data.pagination?.hasNext) ||
    (typeof result.data.pagination?.nextPage === "number" &&
      result.data.pagination.nextPage > page) ||
    items.length > 0;

  return Response.json({ items, hasNextPage });
}
