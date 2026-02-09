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
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-body)]">
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
          {/* Hero Section */}
          <section className="relative h-[500px] overflow-hidden">
            {banner ? (
              <div className="absolute inset-0">
                <img
                  src={banner}
                  alt={title}
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/40 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950" />
            )}

            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-12 pb-10">
              <div className="max-w-[1600px] mx-auto">
                {detail.synonym ? (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mb-2 font-bold">
                    {detail.synonym}
                  </p>
                ) : (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mb-2 font-bold">
                    ANIME DETAILS
                  </p>
                )}

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl leading-tight font-[family-name:var(--font-display)] tracking-wide animate-slide-up">
                  {title}
                </h1>

                {/* Genre badges */}
                <div className="flex flex-wrap gap-2.5 mb-8">
                  {genres.slice(0, 5).map((genre) => (
                    <span
                      key={genre.slug}
                      className="px-4 py-2 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-200 shadow-lg"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Action Bar - FULL WIDTH SOLID ROW */}
                <div className="flex flex-row flex-nowrap items-stretch gap-4 w-full animate-slide-up delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
                  {/* Play Button - Solid Green */}
                  {watchHref ? (
                    <Link
                      href={watchHref}
                      className="group relative flex flex-col items-center justify-center bg-green-600 hover:bg-green-500 rounded-2xl px-10 py-4 h-24 min-w-[180px] flex-shrink-0 transition-all hover:scale-105 shadow-xl shadow-green-900/20"
                    >
                      <svg className="w-10 h-10 text-white mb-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      <span className="text-xs font-black text-white uppercase tracking-wider font-[family-name:var(--font-display)]">PLAY</span>
                    </Link>
                  ) : null}

                  {/* Status Card - Solid Dark */}
                  <div className="relative flex flex-row items-center bg-zinc-950 border border-zinc-800 rounded-2xl flex-1 min-w-[140px] h-24 overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="h-full w-12 flex items-center justify-center bg-zinc-900 border-r border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold [writing-mode:vertical-lr] rotate-180 whitespace-nowrap font-[family-name:var(--font-display)]">STATUS</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-4">
                      <p className="text-xl font-black text-white tracking-tight text-center font-[family-name:var(--font-display)] tracking-wider decoration-slice">{status || 'FINISHED'}</p>
                    </div>
                  </div>

                  {/* Episodes Card - Solid Dark */}
                  <div className="relative flex flex-row items-center bg-zinc-950 border border-zinc-800 rounded-2xl flex-1 min-w-[120px] h-24 overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="h-full w-12 flex items-center justify-center bg-zinc-900 border-r border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold [writing-mode:vertical-lr] rotate-180 whitespace-nowrap font-[family-name:var(--font-display)]">EPISODES</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-4">
                      <p className="text-3xl font-black text-white tracking-tight font-[family-name:var(--font-display)] tracking-wider">{totalEpisodes || '130'}</p>
                    </div>
                  </div>

                  {/* Release Card - Solid Dark */}
                  <div className="relative flex flex-row items-center bg-zinc-950 border border-zinc-800 rounded-2xl flex-1 min-w-[140px] h-24 overflow-hidden group hover:border-zinc-700 transition-colors">
                    <div className="h-full w-12 flex items-center justify-center bg-zinc-900 border-r border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold [writing-mode:vertical-lr] rotate-180 whitespace-nowrap font-[family-name:var(--font-display)]">RELEASE</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-4">
                      <p className="text-sm font-black text-white text-center leading-tight tracking-tight font-[family-name:var(--font-display)] tracking-wider">{detail.aired || 'Jul 5, 2015'}</p>
                    </div>
                  </div>

                  {/* Duration Card - Solid Dark */}
                  {detail.duration ? (
                    <div className="relative flex flex-row items-center bg-zinc-950 border border-zinc-800 rounded-2xl flex-1 min-w-[120px] h-24 overflow-hidden group hover:border-zinc-700 transition-colors">
                      <div className="h-full w-12 flex items-center justify-center bg-zinc-900 border-r border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold [writing-mode:vertical-lr] rotate-180 whitespace-nowrap font-[family-name:var(--font-display)]">DURATION</p>
                      </div>
                      <div className="flex-1 flex items-center justify-center px-4">
                        <p className="text-sm font-black text-white tracking-tight font-[family-name:var(--font-display)] tracking-wider">{detail.duration}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Content Section */}
          <div className="px-4 sm:px-6 lg:px-12 py-14 bg-zinc-950">
            <div className="max-w-[1600px] mx-auto">
              <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-stretch">
                {/* Left Column - Flex to match cover height */}
                <div className="flex flex-col gap-12">
                  {/* Synopsis Card - Expands to match cover height */}
                  <div className="flex-1 bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-800 rounded-2xl p-12 shadow-2xl flex flex-col animate-slide-up delay-300 opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <div className="flex items-center gap-4 mb-8">
                      <span className="w-2 h-10 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></span>
                      <h2 className="text-xl font-black text-zinc-300 uppercase tracking-widest font-[family-name:var(--font-display)]">SYNOPSIS</h2>
                    </div>
                    {synopsis ? (
                      <div className="max-w-4xl">
                        <p className="text-[17px] leading-[2.2] text-zinc-300 text-justify font-normal tracking-wide">
                          {synopsis}
                        </p>
                      </div>
                    ) : (
                      <p className="text-base text-zinc-600">Synopsis not available.</p>
                    )}
                  </div>

                  {/* Episodes Section */}
                  {detail?.episodes && detail.episodes.length > 0 ? (
                    <div className="bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-800 rounded-2xl p-12 shadow-2xl animate-slide-up delay-500 opacity-0" style={{ animationFillMode: 'forwards' }}>
                      <div className="flex items-center gap-4 mb-8">
                        <span className="w-2 h-10 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></span>
                        <h2 className="text-xl font-black text-zinc-300 uppercase tracking-widest font-[family-name:var(--font-display)]">EPISODES</h2>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 xl:grid-cols-13 gap-3">
                        {detail.episodes.map((episode, idx) => (
                          <Link
                            key={episode.slug}
                            href={`/watch/${encodeURIComponent(episode.slug)}?slug=${encodeURIComponent(
                              animeSlug
                            )}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`}
                            className="group relative bg-zinc-900 hover:bg-green-600 border border-zinc-800 hover:border-green-500 rounded-lg p-3 text-center transition-all hover:scale-110 shadow-lg hover:shadow-green-900/50 hover-lift"
                          >
                            <span className="relative z-10 text-sm font-bold text-zinc-300 group-hover:text-white font-[family-name:var(--font-body)]">
                              {idx + 1}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right Column - Sticky Sidebar */}
                <div className="lg:sticky lg:top-24 space-y-10">
                  {/* Poster */}
                  {poster ? (
                    <div className="relative group overflow-hidden rounded-2xl">
                      <img
                        src={poster}
                        alt={title}
                        className="w-full aspect-[2/3] object-cover border-4 border-zinc-800 shadow-2xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  ) : null}

                  {/* Info Card */}
                  <div className="bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-800 rounded-2xl p-10 shadow-2xl space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="w-2 h-10 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></span>
                      <h3 className="text-xl font-black text-zinc-300 uppercase tracking-widest font-[family-name:var(--font-display)]">INFORMATION</h3>
                    </div>
                    <div className="space-y-5 text-sm">
                      {detail.studio ? (
                        <div className="flex justify-between items-center py-4 border-b-2 border-zinc-800">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-[family-name:var(--font-display)]">STUDIO</span>
                          <span className="text-zinc-100 font-black text-base font-[family-name:var(--font-display)] tracking-wide text-right">{detail.studio}</span>
                        </div>
                      ) : null}
                      {season ? (
                        <div className="flex justify-between items-center py-4 border-b-2 border-zinc-800">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-[family-name:var(--font-display)]">SEASON</span>
                          <span className="text-zinc-100 font-black text-base font-[family-name:var(--font-display)] tracking-wide text-right">{season}</span>
                        </div>
                      ) : null}
                      {detail.author ? (
                        <div className="flex justify-between items-center py-4 border-b-2 border-zinc-800">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-[family-name:var(--font-display)]">AUTHOR</span>
                          <span className="text-zinc-100 font-black text-base font-[family-name:var(--font-display)] tracking-wide text-right">{detail.author}</span>
                        </div>
                      ) : null}
                      {status ? (
                        <div className="flex justify-between items-center py-4">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-[family-name:var(--font-display)]">STATUS</span>
                          <span className={`px-5 py-2.5 rounded-xl text-xs font-black border-2 shadow-lg font-[family-name:var(--font-display)] tracking-wider uppercase ${status.toLowerCase().includes('ongoing')
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/10'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10'
                            }`}>
                            {status}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Download Button */}
                  {detail.batch?.slug ? (
                    <Link
                      href={`/download/${encodeURIComponent(detail.batch.slug)}`}
                      className="group block w-full bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border-2 border-zinc-700 hover:border-zinc-600 text-white text-center rounded-2xl py-6 font-black uppercase tracking-wider transition-all hover:scale-105 shadow-2xl hover:shadow-zinc-700/50"
                    >
                      <span className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="drop-shadow-lg text-sm">Download Batch</span>
                      </span>
                    </Link>
                  ) : null}
                </div>
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
