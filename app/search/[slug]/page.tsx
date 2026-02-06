import AnimeCard from "../../components/AnimeCard";
import LoadingMascot from "../../components/LoadingMascot";
import Navbar from "../../components/Navbar";
import { AuthUserSession } from "../../libs/auth-libs";
import { enhanceAnimeImages } from "../../libs/anilist";
import { getApiBase } from "../../libs/api";
import { searchAnime } from "../../libs/search";

type AnimeItem = {
  slug: string;
  title: string;
  poster: string;
  href?: string;
  episode?: string | number | null;
  type?: string | null;
};

export default async function SearchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await AuthUserSession();
  const { slug } = await params;

  let results: AnimeItem[] = [];
  let error: string | null = null;

  try {
    const apiBase = getApiBase();
    results = await searchAnime(slug, apiBase);
    if (results.length > 0) {
      results = await enhanceAnimeImages(results, { limit: 24 });
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Search failed";
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar user={session?.user ?? null} />
      <main className="mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            Search Result
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            "{decodeURIComponent(slug)}"
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {results.length} results found.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-rose-500">
              Search is unavailable right now.
            </p>
          ) : null}
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white/85 p-8 text-zinc-600 shadow-[0_14px_40px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
            <div className="flex flex-col items-center gap-4 text-center">
              <LoadingMascot message="No matches found." />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Try a shorter keyword, remove season tags, or search the main title.
              </p>
            </div>
          </div>
        ) : (
          <div className="-mx-4 packed-grid px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            {results.map((anime) => (
              <AnimeCard
                key={anime.slug}
                slug={anime.slug}
                title={anime.title}
                poster={anime.poster}
                href={anime.href}
                episode={anime.episode}
                type={anime.type}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
