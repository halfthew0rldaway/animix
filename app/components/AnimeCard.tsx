import Link from "next/link";

type AnimeCardProps = {
  slug: string;
  title: string;
  poster: string;
  href?: string;
  episode?: string | number | null;
  type?: string | null;
  releaseDay?: string | null;
};

export default function AnimeCard({
  slug,
  title,
  poster,
  href,
  episode,
  type,
  releaseDay,
}: AnimeCardProps) {
  return (
    <Link
      href={href ?? `/detail/${encodeURIComponent(slug)}`}
      prefetch={false}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl active:translate-y-0 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <img
          src={poster}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {(type || episode) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {type ? (
              <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-sm backdrop-blur-md">
                {type}
              </span>
            ) : null}
            {episode ? (
              <span className="rounded-full bg-zinc-900/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm backdrop-blur-md">
                Ep {episode}
              </span>
            ) : null}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className="text-sm font-bold text-zinc-900 decoration-zinc-900/0 transition-colors group-hover:text-green-600 dark:text-zinc-100 dark:group-hover:text-green-400 leading-snug"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {releaseDay ? <span>{releaseDay}</span> : null}
        </div>
      </div>
    </Link>
  );
}
