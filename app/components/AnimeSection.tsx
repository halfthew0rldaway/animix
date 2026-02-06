import AnimeCard from "./AnimeCard";

type AnimeItem = {
  slug: string;
  title: string;
  poster: string;
  href?: string;
  episode?: string | number | null;
  type?: string | null;
  release_day?: string | null;
};

type AnimeSectionProps = {
  title: string;
  caption?: string;
  animes: AnimeItem[];
  warning?: string | null;
};

export default function AnimeSection({ title, caption, animes, warning }: AnimeSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-100">
            {title}
          </h2>
          {caption ? (
            <p className="caption text-xs text-zinc-500 dark:text-zinc-400">
              <span className="typewriter">{caption}</span>
            </p>
          ) : null}
        </div>
        {warning ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <span className="typewriter">{warning}</span>
          </span>
        ) : null}
      </div>
      {animes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Belum ada data untuk ditampilkan.
        </div>
      ) : (
        <div className="-mx-4 packed-grid px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          {animes.map((anime) => (
            <AnimeCard
              key={anime.slug}
              slug={anime.slug}
              title={anime.title}
              poster={anime.poster}
              href={anime.href}
              episode={anime.episode}
              type={anime.type}
              releaseDay={anime.release_day}
            />
          ))}
        </div>
      )}
    </section>
  );
}
