import Link from "next/link";

type HeroAnime = {
  slug: string;
  title: string;
  poster: string;
  type?: string | null;
  episode?: string | number | null;
};

type HeroSectionProps = {
  featured?: HeroAnime | null;
  recommendations?: HeroAnime[];
};

export default function HeroSection({
  featured,
  recommendations = [],
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white">
      {featured?.poster ? (
        <div className="absolute inset-0">
          <img
            src={featured.poster}
            alt={featured.title}
            className="h-full w-full object-cover opacity-85"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-zinc-950/10" />
          <div className="absolute inset-0 bg-zinc-950/10" />
        </div>
      ) : null}
      <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:p-10">
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-300">
              Featured
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">
              {featured?.title ?? "Animix"}
            </h1>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-300">
              {featured?.type ? <span>{featured.type}</span> : null}
              {featured?.episode ? <span>Ep {featured.episode}</span> : null}
            </div>
            <p className="text-sm text-zinc-300">
              Curated spotlight — jump straight in.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {featured ? (
              <Link
                href={`/detail/${encodeURIComponent(featured.slug)}`}
                className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-900 transition hover:-translate-y-[1px] active:translate-y-0"
              >
                Watch Now
              </Link>
            ) : null}
            <Link
              href="/animelist"
              className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:-translate-y-[1px] hover:border-white/70 active:translate-y-0"
            >
              Browse List
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">
            Recommendations
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {recommendations.slice(0, 6).map((item) => (
              <Link
                key={item.slug}
                href={`/detail/${encodeURIComponent(item.slug)}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80"
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="h-24 w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-xs text-white">
                  {item.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
