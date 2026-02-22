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
          Belum ada data populer.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
      <div className="absolute inset-0 z-0">
        <picture>
          <source media="(max-width: 768px)" srcSet={current.poster} />
          <img
            src={backdrop}
            alt={current.title}
            className="h-full w-full object-cover opacity-80"
            style={{
              filter: "brightness(0.8) contrast(1.1) saturate(1.1)",
            }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
      </div>

      <div className="relative z-10 grid gap-8 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:p-10">
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="w-fit rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400 border border-green-500/20 backdrop-blur-md">
              POPULER
            </p>
            <h1 className="text-3xl font-black leading-none tracking-tight md:text-5xl lg:text-6xl max-w-2xl drop-shadow-xl">
              {current.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest text-zinc-300">
              {current.type ? (
                <span className="bg-white/10 px-3 py-1 rounded-md backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                  {current.type}
                </span>
              ) : null}
              {current.episode ? (
                <span className="bg-white/10 px-3 py-1 rounded-md backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                  Ep {current.episode}
                </span>
              ) : null}
              {current.release_day ? (
                <span className="bg-white/10 px-3 py-1 rounded-md backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                  {current.release_day}
                </span>
              ) : null}
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-300 font-medium line-clamp-3 md:line-clamp-none drop-shadow-md">
              Rekomendasi terbaik minggu ini. Ikuti terus update terbarunya dan jangan lewatkan episode spesial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href={
                current.href ??
                `/detail/${encodeURIComponent(current.slug)}`
              }
              className="rounded-full bg-green-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-green-900/20 transition-all hover:bg-green-500 hover:scale-105 hover:shadow-green-500/30 active:scale-95"
            >
              NONTON SEKARANG
            </Link>
            <button
              type="button"
              onClick={() => setAutoPlay((prev) => !prev)}
              className="rounded-full border border-white/30 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-black/20 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/50 active:scale-95"
            >
              {autoPlay ? "JEDA" : "PUTAR"} TRAILER
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setIndex((prev) => (prev - 1 + list.length) % list.length)
                }
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-white hover:text-black hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev + 1) % list.length)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-white hover:text-black hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col justify-end">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              REKOMENDASI LAINNYA
            </p>
            <div className="grid grid-cols-2 gap-3">
              {recommendations.slice(0, 4).map((item, key) => (
                <button
                  key={`${item.slug}-${key}`}
                  type="button"
                  onClick={() => setIndex(list.indexOf(item))}
                  className="group relative flex h-20 w-full overflow-hidden rounded-xl bg-black/50 text-left transition-all hover:scale-[1.02] hover:ring-2 hover:ring-white/20"
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-50"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
                  <div className="relative flex h-full items-center px-4">
                    <span className="line-clamp-2 text-[10px] font-bold uppercase tracking-wide text-white group-hover:text-green-400 transition-colors">
                      {item.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
