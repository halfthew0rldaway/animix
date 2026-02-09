"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type HeroItem = {
  slug: string;
  title: string;
  poster: string;
  banner?: string | null;
  href?: string | null;
  episode?: string | number | null;
  type?: string | null;
  release_day?: string | null;
};

type HeroCarouselProps = {
  items: HeroItem[];
};

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const list = useMemo(() => {
    const base = items.filter((item) => item?.poster && item?.title);
    const withBanner = base.filter((item) => item?.banner);
    return withBanner.length > 0 ? withBanner : base;
  }, [items]);

  useEffect(() => {
    if (list.length < 2 || !autoPlay) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
    }, 7000);
    return () => clearInterval(id);
  }, [list.length, autoPlay]);

  useEffect(() => {
    if (index >= list.length) {
      setIndex(0);
    }
  }, [index, list.length]);

  const current = list[index];
  const backdrop = current?.banner ?? current?.poster;
  /* Randomize recommendations on mount to avoid hydration mismatch */
  const [recommendations, setRecommendations] = useState<HeroItem[]>([]);

  useEffect(() => {
    // Filter out current item from recommendations if needed, or just shuffle list
    const available = list.filter(item => item.slug !== current.slug);
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    setRecommendations(shuffled.slice(0, 8)); // Even number (8)
  }, [list, current.slug]);

  if (!current) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-zinc-100 p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No hero data yet.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
      <div className="absolute inset-0">
        <picture>
          <source media="(max-width: 768px)" srcSet={current.poster} />
          <img
            src={backdrop}
            alt={current.title}
            className="h-full w-full object-cover opacity-80"
            style={{
              filter: "brightness(0.95) contrast(1.1) saturate(1.25)",
            }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
      </div>

      <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:p-10">
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-green-400 font-bold font-[family-name:var(--font-display)] animate-fade-in">
              FEATURED
            </p>
            <h1 className="text-3xl font-black md:text-5xl drop-shadow-2xl font-[family-name:var(--font-display)] leading-tight tracking-wide animate-slide-up">
              {current.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-zinc-300 font-bold animate-slide-up delay-100 opacity-0" style={{ animationFillMode: 'forwards' }}>
              {current.type ? (
                <span className="px-3 py-1 bg-white/10 rounded-md backdrop-blur-sm border border-white/10">{current.type}</span>
              ) : null}
              {current.episode ? (
                <span className="px-3 py-1 bg-white/10 rounded-md backdrop-blur-sm border border-white/10">Ep {current.episode}</span>
              ) : null}
              {current.release_day ? (
                <span className="px-3 py-1 bg-white/10 rounded-md backdrop-blur-sm border border-white/10">{current.release_day}</span>
              ) : null}
            </div>
            <p className="text-sm text-zinc-300 max-w-xl font-medium leading-relaxed drop-shadow-md animate-slide-up delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
              Spotlight pick from the latest updates. Watch the newest episode now.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 animate-slide-up delay-300 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <Link
              href={
                current.href ??
                `/detail/${encodeURIComponent(current.slug)}`
              }
              className="rounded-full bg-green-600 px-8 py-4 text-xs font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-green-900/40 transition hover:-translate-y-1 hover:bg-green-500 hover:shadow-green-500/30 active:translate-y-0"
            >
              Watch Now
            </Link>
            <button
              type="button"
              onClick={() => setAutoPlay((prev) => !prev)}
              className="rounded-full border-2 border-white/20 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:-translate-y-1 hover:border-white/60 hover:bg-white/5 active:translate-y-0"
            >
              {autoPlay ? "Pause" : "Play"} Hero
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setIndex((prev) => (prev - 1 + list.length) % list.length)
                }
                className="rounded-full border border-white/20 w-10 h-10 flex items-center justify-center text-white/80 transition hover:bg-white/10 hover:border-white/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev + 1) % list.length)}
                className="rounded-full border border-white/20 w-10 h-10 flex items-center justify-center text-white/80 transition hover:bg-white/10 hover:border-white/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur-md shadow-2xl flex flex-col h-full animate-fade-in delay-500 opacity-0" style={{ animationFillMode: 'forwards' }}>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-bold mb-4 font-[family-name:var(--font-display)]">
            RECOMMENDATIONS
          </p>
          <div className="grid gap-3 sm:grid-cols-2 flex-1 content-start">
            {recommendations.length > 0 ? recommendations.map((item, key) => (
              <button
                key={`${item.slug}-${key}`}
                type="button"
                onClick={() => setIndex(list.indexOf(item))}
                className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 text-left h-20 transition-all hover:border-zinc-600 hover:scale-[1.02]"
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:opacity-40 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent" />
                <div className="absolute inset-0 p-3 flex items-center">
                  <span className="text-[10px] font-bold text-zinc-100 line-clamp-2 leading-tight uppercase tracking-wide group-hover:text-green-400 transition-colors font-[family-name:var(--font-display)]">
                    {item.title}
                  </span>
                </div>
              </button>
            )) : (
              <p className="text-xs text-zinc-500 col-span-2 text-center py-10">Loading suggestions...</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
