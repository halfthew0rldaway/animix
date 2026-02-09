"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AnimeCard from "./AnimeCard";
import { notifyRateLimit, updateRateLimitUsage } from "../libs/rateLimitClient";

const LETTERS = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

type AnimeItem = {
  slug: string;
  title: string;
  poster: string;
  banner?: string | null;
  href?: string;
  type?: string | null;
};

type AnimeListClientProps = {
  initialLetter: string;
  initialPage: number;
  initialAnimes: AnimeItem[];
};

export default function AnimeListClient({
  initialLetter,
  initialPage,
  initialAnimes,
}: AnimeListClientProps) {
  const [letter, setLetter] = useState(initialLetter);
  const [page, setPage] = useState(initialPage);
  const [animes, setAnimes] = useState<AnimeItem[]>(initialAnimes);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const didMountRef = useRef(false);

  const listTitle = useMemo(() => `Anime List ${letter}`, [letter]);

  const fetchPage = useCallback(async (nextPage: number, replace = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/animelist?letter=${encodeURIComponent(letter)}&page=${nextPage}`
      );
      const waitHeader = res.headers.get("x-animix-rate-limit-wait");
      const usedHeader = res.headers.get("x-animix-rate-limit-used");
      const limitHeader = res.headers.get("x-animix-rate-limit-limit");
      const windowHeader = res.headers.get("x-animix-rate-limit-window");
      if (usedHeader && limitHeader) {
        const used = Number(usedHeader);
        const limit = Number(limitHeader);
        const windowMs = windowHeader ? Number(windowHeader) : undefined;
        updateRateLimitUsage(used, limit, "animelist", windowMs);
      }
      if (waitHeader) {
        const waitMs = Number(waitHeader);
        if (!Number.isNaN(waitMs) && waitMs > 0) {
          notifyRateLimit(waitMs, "animelist");
        }
      }
      if (!res.ok) {
        throw new Error(`Failed with ${res.status}`);
      }
      const json = await res.json();
      const fetched: AnimeItem[] =
        json?.result?.animes ?? json?.animes ?? json?.data?.animes ?? [];
      setAnimes((prev) => (replace ? fetched : [...prev, ...fetched]));
      setPage(nextPage);
      setHasMore(fetched.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [letter]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setHasMore(true);
    fetchPage(1, true);
  }, [letter, fetchPage]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const target = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchPage(page + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, hasMore, page, letter, fetchPage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0 no-scrollbar items-center">
        {LETTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLetter(item)}
            className={`min-w-[40px] flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] transition hover:-translate-y-[1px] active:translate-y-0 ${item === letter
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-md transform scale-105"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-300 bg-white dark:bg-zinc-900"
              }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-100">
          {listTitle}
        </h2>
        {error ? (
          <span className="text-xs text-rose-500">{error}</span>
        ) : null}
      </div>

      {animes.length === 0 && loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="px-6 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
              Loading list
            </p>
          </div>
          <div className="border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="py-6">
              <div className="loading-wrap">
                <div className="loading-mascot">
                  <span className="loading-mouth" />
                </div>
                <div className="loading-bar" />
                <p className="loading-text">Preparing the list...</p>
              </div>
            </div>
          </div>
        </div>
      ) : animes.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Tidak ada anime untuk huruf ini.
        </div>
      ) : (
        <div className="-mx-4 packed-grid px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          {animes.map((anime) => (
            <AnimeCard
              key={`${anime.slug}-${anime.title}`}
              slug={anime.slug}
              title={anime.title}
              poster={anime.poster}
              href={anime.href}
              type={anime.type}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} />

      {loading ? (
        <p className="text-sm text-zinc-500">Memuat data...</p>
      ) : null}
      {!hasMore && animes.length > 0 ? (
        <p className="text-sm text-zinc-500">Sudah di akhir daftar.</p>
      ) : null}
    </div>
  );
}
