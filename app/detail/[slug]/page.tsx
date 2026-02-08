import Link from "next/link";
import Navbar from "../../components/Navbar";
import { AuthUserSession } from "../../libs/auth-libs";
import { buildApiUrl, safeFetchJson } from "../../libs/api";
import { fetchAniListById, fetchAniListByTitle } from "../../libs/anilist";
import { fetchHiAnimeInfoByTitle } from "../../libs/consumet";

type EpisodeItem = { slug: string; name: string };

type GenreItem = { slug: string; name: string };

type Detail = {
  slug?: string;
  title: string;
  poster: string;
  banner?: string;
  background?: string;
  backdrop?: string;
  synopsis?: string;
  duration?: string;
  author?: string;
  season?: string;
  aired?: string;
  studio?: string;
  synonym?: string;
  status?: string;
  genres?: GenreItem[];
  episodes?: EpisodeItem[];
  batch?: { slug?: string };
};

type DetailResponse = {
  detail?: Detail;
  data?: Detail;
  result?: { detail?: Detail };
};

const extractDetail = (payload: DetailResponse): Detail | null => {
  if (payload.detail) return payload.detail;
  if (payload.result?.detail) return payload.result.detail;
  if (payload.data) return payload.data;
  return null;
};

const stripHtml = (value: string) =>
  value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]*>/g, "").trim();

export default async function DetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await AuthUserSession();
  const { slug } = await params;

  let detail: Detail | null = null;
  let error: string | null = null;
  let hiAnimeInfo: Awaited<ReturnType<typeof fetchHiAnimeInfoByTitle>> = null;
  let aniListMedia: Awaited<ReturnType<typeof fetchAniListByTitle>> = null;

  try {
    const res = await safeFetchJson<DetailResponse>(
      buildApiUrl(`/detail/${encodeURIComponent(slug)}`),
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      detail = extractDetail(res.data);
    } else {
      error = res.error;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load detail";
  }

  if (detail?.title) {
    try {
      hiAnimeInfo = await fetchHiAnimeInfoByTitle(detail.title);
    } catch {
      hiAnimeInfo = null;
    }
  }

  try {
    if (hiAnimeInfo?.alID) {
      aniListMedia = await fetchAniListById(hiAnimeInfo.alID);
    } else if (detail?.title) {
      aniListMedia = await fetchAniListByTitle(detail.title, { slug: detail.slug });
    }
  } catch {
    aniListMedia = null;
  }

  const title = detail?.title ?? slug;
  const detailBanner =
    detail?.banner ?? detail?.background ?? detail?.backdrop ?? null;
  const poster =
    aniListMedia?.coverImage?.extraLarge ??
    aniListMedia?.coverImage?.large ??
    detail?.poster ??
    hiAnimeInfo?.image ??
    "";
  const banner = aniListMedia?.bannerImage ?? detailBanner ?? poster;
  const animeSlug = detail?.slug ?? slug;
  const synopsisRaw =
    detail?.synopsis ?? hiAnimeInfo?.description ?? aniListMedia?.description ?? "";
  const synopsis = synopsisRaw ? stripHtml(synopsisRaw) : "";
  const genres = detail?.genres ?? hiAnimeInfo?.genres?.map((name) => ({ slug: name, name })) ?? [];
  const status = detail?.status ?? hiAnimeInfo?.status ?? "";
  const season = detail?.season ?? hiAnimeInfo?.season ?? "";
  const totalEpisodes = hiAnimeInfo?.totalEpisodes ?? detail?.episodes?.length;

  const watchHref = detail?.episodes?.[0]
    ? `/watch/${encodeURIComponent(detail.episodes[0].slug)}?slug=${encodeURIComponent(
      animeSlug
    )}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={session?.user ?? null} />

      {error ? (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-8 text-center backdrop-blur-sm">
            <p className="text-rose-400">Details are unavailable. Please refresh.</p>
          </div>
        </div>
      ) : null}

      {detail ? (
        <main className="relative">
          {/* Compact Hero Section */}
          <section className="relative h-[400px] overflow-hidden">
            {/* Background with multiple character images */}
            {banner ? (
              <div className="absolute inset-0">
                <img
                  src={banner}
                  alt={title}
                  className="h-full w-full object-cover object-top"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950" />
            )}

            {/* Content at bottom-left */}
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-10 pb-6">
              <div className="max-w-7xl mx-auto">
                {/* Small subtitle */}
                {detail.synonym ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
                    {detail.synonym}
                  </p>
                ) : (
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
                    ANIME DETAILS
                  </p>
                )}

                {/* Large Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
                  {title}
                </h1>

                {/* Compact Genre badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {genres.slice(0, 4).map((genre) => (
                    <span
                      key={genre.slug}
                      className="px-2.5 py-1 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded text-xs font-medium uppercase tracking-wide text-zinc-300"
                    >
                      {genre.name}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded text-xs font-medium uppercase tracking-wide text-zinc-300">
                    ANIME
                  </span>
                </div>

                {/* Info Cards Row */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-4xl">
                  {/* Play Button */}
                  {watchHref ? (
                    <Link
                      href={watchHref}
                      className="flex items-center justify-center bg-green-600 hover:bg-green-500 text-white rounded-lg h-24 font-bold transition-all hover:scale-105 shadow-lg"
                    >
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </Link>
                  ) : null}

                  {/* Status */}
                  <div className="relative bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg h-24 overflow-hidden flex items-center justify-center">
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-zinc-900/50">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 [writing-mode:vertical-lr] rotate-180">STATUS</p>
                    </div>
                    <p className="text-xl font-bold text-white pl-6">{status || 'Ongoing'}</p>
                  </div>

                  {/* Episodes */}
                  <div className="relative bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg h-24 overflow-hidden flex items-center justify-center">
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-zinc-900/50">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 [writing-mode:vertical-lr] rotate-180">EPISODES</p>
                    </div>
                    <p className="text-xl font-bold text-white pl-6">{totalEpisodes || '?'}</p>
                  </div>

                  {/* Release */}
                  <div className="relative bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg h-24 overflow-hidden flex items-center justify-center">
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-zinc-900/50">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 [writing-mode:vertical-lr] rotate-180">RELEASE</p>
                    </div>
                    <p className="text-base font-bold text-white pl-6">{detail.aired || 'Unknown'}</p>
                  </div>

                  {/* Duration */}
                  <div className="relative bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg h-24 overflow-hidden flex items-center justify-center">
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-zinc-900/50">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 [writing-mode:vertical-lr] rotate-180">DURATION</p>
                    </div>
                    <p className="text-base font-bold text-white pl-6">{detail.duration || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Synopsis & Poster Section */}
          <div className="px-4 sm:px-6 lg:px-10 py-8 bg-zinc-950">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                {/* Left - Synopsis & Episodes */}
                <div className="space-y-6">
                  {/* Synopsis */}
                  <div>
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">SYNOPSIS</h2>
                    {synopsis ? (
                      <p className="text-sm leading-relaxed text-zinc-400">{synopsis}</p>
                    ) : (
                      <p className="text-sm text-zinc-600">Synopsis not available.</p>
                    )}
                  </div>

                  {/* Episodes Grid */}
                  {detail?.episodes && detail.episodes.length > 0 ? (
                    <div>
                      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">EPISODES</h2>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {detail.episodes.map((episode, idx) => (
                          <Link
                            key={episode.slug}
                            href={`/watch/${encodeURIComponent(episode.slug)}?slug=${encodeURIComponent(
                              animeSlug
                            )}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`}
                            className="bg-zinc-900 hover:bg-green-600 border border-zinc-800 hover:border-green-500 rounded-lg p-3 text-center text-sm font-semibold text-white transition-all hover:scale-105"
                          >
                            {idx + 1}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right - Poster */}
                {poster ? (
                  <div className="space-y-4">
                    <img
                      src={poster}
                      alt={title}
                      className="w-full aspect-[2/3] object-cover rounded-lg border border-zinc-800"
                    />

                    {/* Additional Info */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3 text-sm">
                      {detail.studio ? (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-zinc-500">Studio</p>
                          <p className="text-white font-medium">{detail.studio}</p>
                        </div>
                      ) : null}
                      {season ? (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-zinc-500">Season</p>
                          <p className="text-white font-medium">{season}</p>
                        </div>
                      ) : null}
                      {detail.author ? (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-zinc-500">Author</p>
                          <p className="text-white font-medium">{detail.author}</p>
                        </div>
                      ) : null}
                    </div>

                    {/* Download Button */}
                    {detail.batch?.slug ? (
                      <Link
                        href={`/download/${encodeURIComponent(detail.batch.slug)}`}
                        className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white text-center rounded-lg py-3 font-bold text-sm uppercase tracking-wide transition-all hover:scale-105"
                      >
                        Download Batch
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex min-h-screen items-center justify-center p-4">
          <p className="text-zinc-500">Detail not found.</p>
        </div>
      )}
    </div>
  );
}
