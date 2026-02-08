import { NextRequest } from "next/server";
import { safeFetchJson } from "../../libs/api";

export const runtime = "nodejs";

type MangaApiResponse = {
  comics?: Array<Record<string, unknown>>;
  data?: {
    comics?: Array<Record<string, unknown>>;
    pagination?: { hasNextPage?: boolean | null; nextPage?: number | null } | null;
  };
  pagination?: { hasNextPage?: boolean | null; nextPage?: number | null } | null;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeTitleKey = (value: string) => {
  const stop = new Set([
    "the",
    "a",
    "an",
    "of",
    "and",
    "to",
    "in",
    "no",
    "ni",
    "ga",
    "wo",
    "wa",
    "de",
    "la",
    "le",
    "el",
  ]);
  return normalize(value)
    .split(" ")
    .filter((token) => token && !stop.has(token))
    .join(" ");
};


const tokenizeTitle = (value: string) => {
  const key = normalizeTitleKey(value);
  return key ? key.split(" ").filter(Boolean) : [];
};

const extractSize = (url: string) => {
  const match = url.match(/(\d{2,4})x(\d{2,4})/);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
};

const coverQualityHint = (url: string) => {
  const lowered = url.toLowerCase();
  let score = 0;
  if (lowered.includes("thumbnail") || lowered.includes("thumb") || lowered.includes("small")) {
    score -= 2;
  }
  if (lowered.includes("large") || lowered.includes("original") || lowered.includes("full")) {
    score += 1;
  }
  return score;
};

const pickBetterCover = (current: string, candidate: string) => {
  const currentBad = isLikelyBadCover(current);
  const candidateBad = isLikelyBadCover(candidate);
  if (currentBad && !candidateBad) return candidate;
  if (!currentBad && candidateBad) return current;

  const currentHint = coverQualityHint(current);
  const candidateHint = coverQualityHint(candidate);
  if (currentHint !== candidateHint) {
    return candidateHint > currentHint ? candidate : current;
  }

  const currentSize = extractSize(current);
  const candidateSize = extractSize(candidate);
  if (currentSize && candidateSize) {
    const currentArea = currentSize.width * currentSize.height;
    const candidateArea = candidateSize.width * candidateSize.height;
    return candidateArea > currentArea ? candidate : current;
  }
  if (!currentSize && candidateSize) return candidate;
  return current || candidate;
};

const pickSlug = (item: Record<string, unknown>, title: string) => {
  const slug = item.slug as string | undefined;
  if (slug) return slug;
  const link = (item.link as string | undefined) ?? (item.url as string | undefined);
  if (link) {
    const cleaned = link.replace(/^https?:\/\/[^/]+\//, "").replace(/^\/+|\/+$/g, "");
    const parts = cleaned.split("/").filter(Boolean);
    const last = parts.pop();
    if (last && last !== "manga" && last !== "detail-komik") return last;
  }
  return normalize(title).replace(/\s+/g, "-");
};

const pickCover = (item: Record<string, unknown>) =>
  (item.coverImage as string | undefined) ??
  (item.cover_image as string | undefined) ??
  (item.poster as string | undefined) ??
  (item.posterImage as string | undefined) ??
  (item.image as string | undefined) ??
  (item.image_url as string | undefined) ??
  (item.coverUrl as string | undefined) ??
  (item.cover_url as string | undefined) ??
  (item.thumbnail as string | undefined) ??
  (item.cover as string | undefined) ??
  "/placeholder-manga.svg";

const upgradeCoverUrl = (url: string) => {
  if (!url) return url;
  let next = url;
  if (next.includes("thumbnail.komiku.org")) {
    next = next.replace("thumbnail.komiku.org", "img.komiku.org");
  }
  if (next.includes("?resize=")) {
    next = next.split("?")[0];
  }
  return next;
};

const normalizeCover = (item: Record<string, unknown>) => {
  const image = (item.image as string | undefined) ?? "";
  const thumbnail = (item.thumbnail as string | undefined) ?? "";
  const cover = (item.cover as string | undefined) ?? "";
  const coverImage = (item.coverImage as string | undefined) ?? "";
  const coverImageAlt = (item.cover_image as string | undefined) ?? "";
  const poster = (item.poster as string | undefined) ?? "";
  const posterImage = (item.posterImage as string | undefined) ?? "";
  const imageUrl = (item.image_url as string | undefined) ?? "";
  const coverUrl = (item.coverUrl as string | undefined) ?? "";
  const coverUrlAlt = (item.cover_url as string | undefined) ?? "";

  let primary = pickCover(item) || "";
  if (primary.toLowerCase().includes("lazy.jpg")) {
    const fallback = [coverImage, coverImageAlt, poster, posterImage, imageUrl, coverUrl, coverUrlAlt, cover, image, thumbnail]
      .find((value) => value && !value.toLowerCase().includes("lazy.jpg"));
    if (fallback) primary = fallback;
  }

  const rawCandidates = [
    coverImage,
    coverImageAlt,
    poster,
    posterImage,
    imageUrl,
    coverUrl,
    coverUrlAlt,
    image,
    thumbnail,
    cover,
  ].filter(Boolean);

  const candidates = new Set<string>();
  if (primary) {
    candidates.add(primary);
    candidates.add(upgradeCoverUrl(primary));
  }
  for (const candidate of rawCandidates) {
    candidates.add(candidate);
    candidates.add(upgradeCoverUrl(candidate));
  }

  let best = "";
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!best) {
      best = candidate;
      continue;
    }
    best = pickBetterCover(best, candidate);
  }

  return best || "/placeholder-manga.svg";
};

const isLikelyBadCover = (url: string) => {
  if (!url) return true;
  const lowered = url.toLowerCase();
  if (
    lowered.includes("lazy.jpg") ||
    lowered.includes("placeholder") ||
    lowered.includes("noimage") ||
    lowered.includes("default") ||
    lowered.includes("blank") ||
    lowered.endsWith(".svg")
  ) {
    return true;
  }
  if (/\b\d{2,3}x\d{2,3}\b/.test(lowered)) {
    return true;
  }
  if (/-\d{2,3}x\d{2,3}\./.test(lowered)) {
    return true;
  }
  return false;
};

const pickTitle = (item: Record<string, unknown>) =>
  (item.title as string | undefined) ??
  (item.name as string | undefined) ??
  "Untitled";

const toMangaItem = (item: Record<string, unknown>) => {
  const title = pickTitle(item);
  const slug = pickSlug(item, title);
  return {
    id: slug,
    title,
    cover: normalizeCover(item),
    description: (item.synopsis as string | undefined) ?? (item.description as string | undefined) ?? "",
    status: (item.status as string | undefined) ?? "",
    type: (item.type as string | undefined) ?? "Manga",
    rating: (item.rating as string | undefined) ?? "",
    slug,
    genres: (item.genres as string[] | undefined) ?? [],
  };
};

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_MANGA_API_URL;
  if (!base) {
    return Response.json({ error: "Missing NEXT_PUBLIC_MANGA_API_URL" }, { status: 500 });
  }

  const pageParam = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const perPageParam = Number(req.nextUrl.searchParams.get("perPage") ?? "24");
  const typeParam = (req.nextUrl.searchParams.get("type") ?? "popular").toLowerCase();

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPage = Number.isFinite(perPageParam)
    ? Math.min(Math.max(perPageParam, 6), 36)
    : 24;

  const urlBase = base.replace(/\/+$/, "");
  const unlimitedRes = await safeFetchJson<MangaApiResponse>(
    `${urlBase}/unlimited`,
    { next: { revalidate: 3600 } },
    { cacheKey: "manga-unlimited", ttlMs: 1000 * 60 * 60, errorTtlMs: 1000 * 60 }
  );

  if (!unlimitedRes.ok) {
    return Response.json({ error: unlimitedRes.error }, { status: 502 });
  }

  const rawUnlimited =
    unlimitedRes.data?.comics ??
    unlimitedRes.data?.data?.comics ??
    [];

  const numericFrom = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const match = value.replace(",", ".").match(/(\d+(\.\d+)?)/);
      if (match) return Number(match[1]);
    }
    return 0;
  };

  const dateFrom = (value: unknown) => {
    if (typeof value !== "string") return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const latestScore = (item: Record<string, unknown>) => {
    return Math.max(
      numericFrom(item.latestChapter),
      numericFrom(item.lastChapter),
      numericFrom(item.chapter),
      numericFrom(item.latest),
      numericFrom(item.update),
      numericFrom(item.updated),
      dateFrom(item.releaseDate),
      dateFrom(item.lastReleaseDate),
      dateFrom(item.latestReleaseDate),
      dateFrom(item.date)
    );
  };

  const popularScore = (item: Record<string, unknown>) => {
    return Math.max(
      numericFrom(item.views),
      numericFrom(item.view),
      numericFrom(item.viewer),
      numericFrom(item.rating),
      numericFrom(item.score),
      numericFrom(item.follower),
      numericFrom(item.followers),
      numericFrom(item.favorite),
      numericFrom(item.favorites),
      numericFrom(item.likes),
      numericFrom(item.popularity)
    );
  };

  const hash = (value: string) => {
    let h = 0;
    for (let i = 0; i < value.length; i += 1) {
      h = (h << 5) - h + value.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const filteredRaw = rawUnlimited.filter((item) => {
    const title = String(item.title ?? item.name ?? "");
    const chapter = String(item.chapter ?? "");
    const lower = `${title} ${chapter}`.toLowerCase();
    return !lower.includes("apk") && !lower.includes("download");
  });

  const deduped = new Map<string, { raw: Record<string, unknown>; parsed: ReturnType<typeof toMangaItem> }>();
  for (const raw of filteredRaw) {
    const parsed = toMangaItem(raw);
    const key = parsed.slug || normalize(parsed.title);
    if (!key) continue;
    if (!deduped.has(key)) {
      deduped.set(key, { raw, parsed });
    }
  }

  const list = Array.from(deduped.values()).map((entry) => ({
    raw: entry.raw,
    parsed: entry.parsed,
  }));

  const withScore = list.map((entry) => {
    const score =
      typeParam === "latest"
        ? latestScore(entry.raw)
        : popularScore(entry.raw);
    const fallback = hash(`${typeParam}:${entry.parsed.slug || entry.parsed.title}`);
    return {
      ...entry,
      score: score > 0 ? score : fallback,
    };
  });

  withScore.sort((a, b) => b.score - a.score);

  let items = withScore.map((entry) => entry.parsed);
  items = items.filter((item) => !isLikelyBadCover(item.cover));
  if (items.length === 0) {
    items = withScore.map((entry) => entry.parsed);
  }

  const total = items.length;
  const start = Math.max((page - 1) * perPage, 0);
  const end = start + perPage;
  const slice = items.slice(start, end);
  const hasNextPage = end < total;

  return Response.json({ items: slice, hasNextPage });
}
