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

const extractSamehadakuDetail = (payload: any, actualSlug: string): Detail | null => {
  const dataWrapper = payload?.data;
  const data = dataWrapper?.data || dataWrapper;
  if (!data) return null;
  return {
    slug: `smhd::${actualSlug}`,
    title: data.title || data.japanese || data.english || actualSlug,
    poster: data.poster,
    synopsis: data.synopsis?.paragraphs?.join("\n\n"),
    duration: data.duration,
    author: data.studios,
    season: data.season,
    aired: data.aired,
    studio: data.studios,
    synonym: data.japanese || data.english,
    status: data.status,
    genres: data.genreList?.map((g: any) => ({ slug: g.genreId, name: g.title })),
    episodes: data.episodeList?.map((e: any) => ({
      slug: `smhd::${e.episodeId}`,
      name: typeof e.title === "number" ? `Episode ${e.title}` : (e.title?.toString() || ""),
    })),
    batch: data.batchList?.[0] ? { slug: `smhd::${data.batchList[0].batchId}` } : undefined,
  };
};

export default async function DetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await AuthUserSession();
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const isSamehadaku = decodedSlug.startsWith("smhd::");
  const actualSlug = isSamehadaku ? decodedSlug.slice(6) : decodedSlug;

  let detail: Detail | null = null;
  let error: string | null = null;
  let hiAnimeInfo: Awaited<ReturnType<typeof fetchHiAnimeInfoByTitle>> = null;
  let aniListMedia: Awaited<ReturnType<typeof fetchAniListByTitle>> = null;

  try {
    let url = buildApiUrl(`/detail/${encodeURIComponent(actualSlug)}`);
    if (isSamehadaku) {
      const secondaryBase = process.env.NEXT_PUBLIC_SECONDARY_API_URL?.replace(/\/+$/, "") ?? "";
      url = `${secondaryBase}/anime/${encodeURIComponent(actualSlug)}`;
    }

    const origin = process.env.API_ORIGIN || new URL(url).origin;
    const requestHeaders = {
      "User-Agent":
        process.env.API_USER_AGENT ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Origin: origin,
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
    };

    const res = await safeFetchJson<any>(
      url,
      { next: { revalidate: 300 }, headers: requestHeaders }
    );
    if (res.ok) {
      if (isSamehadaku) {
        detail = extractSamehadakuDetail(res, actualSlug);
      } else {
        detail = extractDetail(res.data);
      }
    } else {
      error = res.error;
    }
  } catch (err) {
    console.error("Fetch detail failed:", err);
    error = err instanceof Error ? err.message : "Failed to load detail";
  }

  if (error) {
    console.error(`Detail page error for ${actualSlug}:`, error);
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

  const firstEpisode = detail?.episodes?.[detail.episodes.length - 1];
  const watchHref = firstEpisode
    ? `/watch/${encodeURIComponent(
      decodeURIComponent(firstEpisode.slug)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents like ü -> u
        .replace(/walka¼re/gi, "walkure") // hard fix for animasu weird encoding bug
    )}?slug=${encodeURIComponent(
      animeSlug
    )}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-body)]">
      <Navbar user={session?.user ?? null} />

      {error ? (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-8 text-center backdrop-blur-sm">
            <p className="text-rose-400">Detail tidak tersedia. Silakan muat ulang.</p>
          </div>
        </div>
      ) : null}

      {detail ? (
        <main className="relative">
          {/* Hero Section - Refactored for Flex Growth */}
          <section className="relative min-h-[60vh] flex flex-col justify-end overflow-hidden pb-10 pt-20">
            {banner ? (
              <div className="absolute inset-0 z-0">
                <img
                  src={banner}
                  alt={title}
                  className="h-full w-full object-cover object-top"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/40 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-900 to-zinc-950" />
            )}

            <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12">
              <div className="max-w-[1600px] mx-auto">
                {detail.synonym ? (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mb-2 font-bold">
                    {detail.synonym}
                  </p>
                ) : (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mb-2 font-bold">
                    DETAIL ANIME
                  </p>
                )}

                <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl leading-tight font-[family-name:var(--font-display)] tracking-wide animate-slide-up break-words">
                  {title}
                </h1>

                {/* Genre badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {genres.slice(0, 5).map((genre) => (
                    <span
                      key={genre.slug}
                      className="px-3 py-1 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 shadow-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Action Bar & Stats */}
                <div className="flex flex-col gap-4 w-full animate-slide-up delay-200" style={{ animationFillMode: 'forwards' }}>

                  {/* Watch Button - Full Width on Mobile, Auto on Desktop */}
                  {watchHref ? (
                    <Link
                      href={watchHref}
                      className="group relative flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 rounded-xl px-6 py-4 w-full md:w-auto md:min-w-[200px] transition-all hover:scale-[1.02] shadow-xl shadow-green-900/20"
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      <span className="text-sm font-black text-white uppercase tracking-wider font-[family-name:var(--font-display)]">MULAI NONTON</span>
                    </Link>
                  ) : null}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full">
                    {/* Status Card */}
                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 flex-1 min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">STATUS</span>
                      <span className="text-sm font-black text-white tracking-wide">{status || 'UNKNOWN'}</span>
                    </div>

                    {/* Episodes Card */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 flex-1 min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">EPISODE</span>
                      <span className="text-sm font-black text-white tracking-wide">{totalEpisodes || '?'}</span>
                    </div>

                    {/* Release Card */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 flex-1 min-w-[100px]">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">RILIS</span>
                      <span className="text-sm font-black text-white tracking-wide text-center leading-tight">{detail.aired || '-'}</span>
                    </div>

                    {/* Duration Card */}
                    {detail.duration ? (
                      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 flex-1 min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">DURASI</span>
                        <span className="text-sm font-black text-white tracking-wide">{detail.duration}</span>
                      </div>
                    ) : null}
                  </div>
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
                  {/* Synopsis Card - Expands to match cover height */}
                  <div className="flex-1 bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-800 rounded-2xl p-6 md:p-12 shadow-2xl flex flex-col animate-slide-up delay-300 opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <div className="flex items-center gap-4 mb-6">
                      <span className="w-1.5 h-8 md:w-2 md:h-10 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></span>
                      <h2 className="text-lg md:text-xl font-black text-zinc-300 uppercase tracking-widest font-[family-name:var(--font-display)]">SINOPSIS</h2>
                    </div>
                    {synopsis ? (
                      <div className="max-w-4xl">
                        <p className="text-[17px] leading-[2.2] text-zinc-300 text-justify font-normal tracking-wide">
                          {synopsis}
                        </p>
                      </div>
                    ) : (
                      <p className="text-base text-zinc-600">Sinopsis belum tersedia.</p>
                    )}
                  </div>

                  {/* Episodes Section */}
                  {detail?.episodes && detail.episodes.length > 0 ? (
                    <div className="bg-zinc-900/60 backdrop-blur-sm border-2 border-zinc-800 rounded-2xl p-6 md:p-12 shadow-2xl animate-slide-up delay-500 opacity-0" style={{ animationFillMode: 'forwards' }}>
                      <div className="flex items-center gap-4 mb-6">
                        <span className="w-1.5 h-8 md:w-2 md:h-10 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></span>
                        <h2 className="text-lg md:text-xl font-black text-zinc-300 uppercase tracking-widest font-[family-name:var(--font-display)]">DAFTAR EPISODE</h2>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 xl:grid-cols-13 gap-3">
                        {[...detail.episodes]
                          .sort((a, b) => {
                            const getNum = (ep: any) => {
                              const match = (ep.name || "").match(/\d+(\.\d+)?/) || (ep.slug || "").match(/episode?-?\s*(\d+(\.\d+)?)/i);
                              return match ? parseFloat(match[1] || match[0]) : 0;
                            };
                            return getNum(a) - getNum(b);
                          })
                          .map((episode) => {
                            const match = (episode.name || "").match(/\d+(\.\d+)?/) || (episode.slug || "").match(/episode?-?\s*(\d+(\.\d+)?)/i);
                            const epLabel = match ? (match[1] || match[0]) : "?";

                            return (
                              <Link
                                key={episode.slug}
                                href={`/watch/${encodeURIComponent(
                                  decodeURIComponent(episode.slug)
                                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                    .replace(/walka¼re/gi, "walkure")
                                )}?slug=${encodeURIComponent(
                                  animeSlug
                                )}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`}
                                className="group relative bg-zinc-900 hover:bg-green-600 border border-zinc-800 hover:border-green-500 rounded-lg p-3 text-center transition-all hover:scale-110 shadow-lg hover:shadow-green-900/50 hover-lift"
                              >
                                <span className="relative z-10 text-sm font-bold text-zinc-300 group-hover:text-white font-[family-name:var(--font-body)]">
                                  {epLabel !== "?" ? epLabel : episode.name}
                                </span>
                              </Link>
                            )
                          }
                          )}
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
                      <h3 className="text-xl font-black text-zinc-300 uppercase tracking-widest font-[family-name:var(--font-display)]">INFORMASI</h3>
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
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-[family-name:var(--font-display)]">MUSIM</span>
                          <span className="text-zinc-100 font-black text-base font-[family-name:var(--font-display)] tracking-wide text-right">{season}</span>
                        </div>
                      ) : null}
                      {detail.author ? (
                        <div className="flex justify-between items-center py-4 border-b-2 border-zinc-800">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-[family-name:var(--font-display)]">PENULIS</span>
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
                        <span className="drop-shadow-lg text-sm">UNDUH BATCH</span>
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
          <p className="text-zinc-500">Detail tidak ditemukan.</p>
        </div>
      )}
    </div>
  );
}
