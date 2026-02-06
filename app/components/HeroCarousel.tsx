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
  const recommendations = list.slice(0, 9);

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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white shadow-[0_24px_80px_rgba(8,10,14,0.45)]">
      <div className="absolute inset-0">
        <picture>
          <source media="(max-width: 768px)" srcSet={current.poster} />
          <img
            src={backdrop}
            alt={current.title}
            className="h-full w-full object-cover"
            style={{
              filter: "brightness(1.08) contrast(1.08) saturate(1.08)",
            }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,11,16,0.7)_0%,rgba(8,11,16,0.4)_45%,rgba(8,11,16,0.2)_70%,rgba(8,11,16,0.08)_100%)]" />
      </div>

      <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:p-10">
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-300">
              Featured
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]">
              {current.title}
            </h1>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-300">
              {current.type ? <span>{current.type}</span> : null}
              {current.episode ? <span>Ep {current.episode}</span> : null}
              {current.release_day ? <span>{current.release_day}</span> : null}
            </div>
            <p className="text-sm text-zinc-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
              Spotlight pick from the latest updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={
                current.href ??
                `/detail/${encodeURIComponent(current.slug)}`
              }
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-900 transition hover:-translate-y-[1px] active:translate-y-0"
            >
              Watch Now
            </Link>
            <button
              type="button"
              onClick={() => setAutoPlay((prev) => !prev)}
              className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-[1px] hover:border-white/80 active:translate-y-0"
            >
              {autoPlay ? "Pause" : "Play"} Hero
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setIndex((prev) => (prev - 1 + list.length) % list.length)
                }
                className="rounded-full border border-white/30 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 transition hover:-translate-y-[1px] hover:border-white/70"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev + 1) % list.length)}
                className="rounded-full border border-white/30 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 transition hover:-translate-y-[1px] hover:border-white/70"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/12 bg-zinc-950/70 p-4 backdrop-blur-[2px]">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">
            Recommendations
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {recommendations.map((item, key) => (
              <button
                key={`${item.slug}-${key}`}
                type="button"
                onClick={() => setIndex(key)}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 text-left"
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
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
