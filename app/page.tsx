import AnimeSectionInfinite from "./components/AnimeSectionInfinite";
import Footer from "./components/Footer";
import HeroCarousel from "./components/HeroCarousel";
import HistoryList from "./components/HistoryList";
import Navbar from "./components/Navbar";
import { AuthUserSession } from "./libs/auth-libs";
import { enhanceAnimeImages, fetchAniListTrending } from "./libs/anilist";
import { buildApiUrl, safeFetchJson } from "./libs/api";

type AnimeItem = {
  slug: string;
  title: string;
  poster: string;
  banner?: string | null;
  href?: string;
  episode?: string | number | null;
  type?: string | null;
  release_day?: string | null;
};

type AnimeListResponse = {
  animes?: AnimeItem[];
  result?: { animes?: AnimeItem[] };
  data?: { animes?: AnimeItem[] };
};

const pickBanner = (item: AnimeItem & Record<string, unknown>) => {
  const candidates = [
    item.banner,
    item.bannerImage as string | undefined,
    item.background as string | undefined,
    item.backdrop as string | undefined,
  ];
  return candidates.find((value) => typeof value === "string" && value.length > 0) ?? null;
};

const extractAnimes = (payload: AnimeListResponse): AnimeItem[] => {
  const list =
    payload.animes ?? payload.result?.animes ?? payload.data?.animes ?? [];
  return list.map((item) => ({
    ...item,
    banner: pickBanner(item as AnimeItem & Record<string, unknown>),
  }));
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const fillSection = (
  primary: AnimeItem[],
  fallback: AnimeItem[],
  minItems: number
) => {
  if (primary.length >= minItems) return primary;
  const seen = new Set(primary.map((item) => item.slug));
  const filled = [...primary];
  for (const item of fallback) {
    if (filled.length >= minItems) break;
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      filled.push(item);
    }
  }
  return filled;
};

export default async function Home() {
  const session = await AuthUserSession();

  let ongoing: AnimeItem[] = [];
  let completed: AnimeItem[] = [];
  let ongoingWarning: string | null = null;
  let completedWarning: string | null = null;

  try {
    const [ongoingRes, completedRes] = await Promise.all([
      safeFetchJson<AnimeListResponse>(buildApiUrl("/ongoing"), {
        next: { revalidate: 300 },
      }),
      safeFetchJson<AnimeListResponse>(buildApiUrl("/completed"), {
        next: { revalidate: 300 },
      }),
    ]);

    if (ongoingRes.ok) {
      ongoing = extractAnimes(ongoingRes.data);
    } else {
      ongoingWarning = "Gagal memuat ongoing";
    }

    if (completedRes.ok) {
      completed = extractAnimes(completedRes.data);
    } else {
      completedWarning = "Gagal memuat completed";
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing API configuration";
    ongoingWarning = message;
    completedWarning = message;
  }

  if (ongoing.length > 0) {
    ongoing = await enhanceAnimeImages(ongoing, { limit: 24 });
  }
  if (completed.length > 0) {
    completed = await enhanceAnimeImages(completed, { limit: 24 });
  }

  const ongoingFilled = fillSection(ongoing, completed, 10);
  const completedFilled = fillSection(completed, ongoing, 10);

  const heroCandidates = [...ongoingFilled, ...completedFilled];
  const heroWithBanners = heroCandidates.filter((item) => Boolean(item.banner));
  let heroItems = [...heroWithBanners, ...heroCandidates].slice(0, 10);

  if (heroWithBanners.length < 5) {
    const trending = await fetchAniListTrending(10);
    if (trending.length > 0) {
      const indexByTitle = new Map(
        heroCandidates.map((item) => [normalize(item.title), item])
      );
      const trendingItems = trending
        .filter((media) => media?.bannerImage)
        .map((media) => {
          const title =
            media.title?.userPreferred ??
            media.title?.english ??
            media.title?.romaji ??
            "Untitled";
          const poster =
            media.coverImage?.extraLarge ??
            media.coverImage?.large ??
            "";
          const banner = media.bannerImage ?? null;
          const normalized = normalize(title);
          const match = indexByTitle.get(normalized);

          if (match) {
            return {
              ...match,
              poster: poster || match.poster,
              banner,
            };
          }

          return {
            slug: normalized.replace(/\s+/g, "-"),
            title,
            poster,
            banner,
            href: `/search/${encodeURIComponent(title)}`,
          };
        });

      heroItems = [...trendingItems, ...heroItems].slice(0, 10);
    }
  }

  const trendingFallback = await fetchAniListTrending(30);
  const trendingItems = trendingFallback.map((media) => {
    const title =
      media.title?.userPreferred ??
      media.title?.english ??
      media.title?.romaji ??
      "Untitled";
    const poster =
      media.coverImage?.extraLarge ??
      media.coverImage?.large ??
      "";
    const banner = media.bannerImage ?? null;
    return {
      slug: normalize(title).replace(/\s+/g, "-"),
      title,
      poster,
      banner,
      href: `/search/${encodeURIComponent(title)}`,
    } satisfies AnimeItem;
  });

  const MIN_SECTION_ITEMS = 24;
  const ongoingWithTrending = fillSection(
    ongoingFilled,
    trendingItems,
    MIN_SECTION_ITEMS
  );
  const completedWithTrending = fillSection(
    completedFilled,
    trendingItems,
    MIN_SECTION_ITEMS
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar user={session?.user ?? null} />
      <main className="mx-auto flex w-full flex-col gap-10 px-4 py-10 sm:px-6 lg:px-10">
        <HeroCarousel items={heroItems} />
        <HistoryList />
        <AnimeSectionInfinite
          title="Ongoing"
          caption="Fresh episodes, still airing."
          initialAnimes={ongoingWithTrending}
          initialPage={2}
          fetchUrl="/api/trending?type=ongoing"
          warning={ongoingWarning ? "Ongoing feed is unavailable. Try refresh." : null}
        />
        <AnimeSectionInfinite
          title="Completed"
          caption="Finished runs, no waiting."
          initialAnimes={completedWithTrending}
          initialPage={2}
          fetchUrl="/api/trending?type=completed"
          warning={completedWarning ? "Completed feed is unavailable. Try refresh." : null}
        />
        <Footer />
      </main>
    </div>
  );
}
