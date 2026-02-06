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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar user={session?.user ?? null} />
      <main className="mx-auto flex w-full flex-col gap-10 px-4 py-10 sm:px-6 lg:px-10">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            Details are unavailable. Please refresh.
          </div>
        ) : null}

        {detail ? (
          <>
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 text-white dark:border-zinc-800">
              {banner ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${banner})` }}
                />
              ) : null}
              <div className="absolute inset-0 bg-zinc-950/55" />
              <div className="relative grid gap-8 p-8 lg:grid-cols-[240px_1fr]">
                <div className="flex flex-col gap-4">
                  {poster ? (
                    <img
                      src={poster}
                      alt={title}
                      className="aspect-[2/3] w-full rounded-2xl border border-white/20 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <div className="flex flex-col gap-3">
                    {watchHref ? (
                      <Link
                        href={watchHref}
                        className="rounded-full bg-white px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-900 transition hover:-translate-y-[1px] active:translate-y-0"
                      >
                        Watch Now
                      </Link>
                    ) : null}
                    {detail.batch?.slug ? (
                      <Link
                        href={`/download/${encodeURIComponent(detail.batch.slug)}`}
                        className="rounded-full border border-white/30 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-[1px] hover:border-white/60 active:translate-y-0"
                      >
                        Download Batch
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-300">
                      Anime Details
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
                      {title}
                    </h1>
                    {detail.synonym ? (
                      <p className="mt-2 text-sm text-zinc-300">
                        {detail.synonym}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-3 text-sm text-zinc-200 sm:grid-cols-2">
                    {status ? <span>Status: {status}</span> : null}
                    {season ? <span>Season: {season}</span> : null}
                    {detail?.aired ? <span>Aired: {detail.aired}</span> : null}
                    {detail?.duration ? (
                      <span>Duration: {detail.duration}</span>
                    ) : null}
                    {detail?.studio ? <span>Studio: {detail.studio}</span> : null}
                    {detail?.author ? <span>Author: {detail.author}</span> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-zinc-100 p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-100">
                    Synopsis
                  </h2>
                  {synopsis ? (
                    <p className="synopsis text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                      {synopsis}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Sinopsis belum tersedia.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-100">
                    Genres
                  </h2>
                  {genres && genres.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <span
                          key={genre.slug}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.15em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Genre belum tersedia.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {status ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Status</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{status}</p>
                  </div>
                ) : null}
                {typeof totalEpisodes === "number" ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Episodes</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{totalEpisodes}</p>
                  </div>
                ) : null}
                {season ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Season</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{season}</p>
                  </div>
                ) : null}
                {detail?.duration ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Duration</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{detail.duration}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-100">
                Episodes
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {detail?.episodes?.map((episode) => (
                  <Link
                    key={episode.slug}
                      href={`/watch/${encodeURIComponent(episode.slug)}?slug=${encodeURIComponent(
                        animeSlug
                      )}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(poster)}`}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:-translate-y-[1px] hover:border-zinc-400 active:translate-y-0 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      {episode.name}
                    </Link>
                  ))}
                </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Detail tidak ditemukan.
          </div>
        )}
      </main>
    </div>
  );
}
