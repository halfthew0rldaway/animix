"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type AnimeSectionInfiniteProps = {
  title: string;
  caption?: string;
  initialAnimes: AnimeItem[];
  warning?: string | null;
  fetchUrl?: string;
  perPage?: number;
  initialPage?: number;
  minRows?: number;
  maxRows?: number;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getKey = (item: AnimeItem) =>
  normalize(item.slug || item.title || "untitled");

const dedupe = (items: AnimeItem[]) => {
  const seen = new Set<string>();
  const result: AnimeItem[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

export default function AnimeSectionInfinite({
  title,
  caption,
  initialAnimes,
  warning,
  fetchUrl = "/api/trending",
  perPage = 24,
  initialPage = 1,
  minRows = 2,
  maxRows = 3,
}: AnimeSectionInfiniteProps) {
  const initialItems = useMemo(() => dedupe(initialAnimes), [initialAnimes]);
  const [items, setItems] = useState<AnimeItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const seenRef = useRef<Set<string>>(new Set(initialItems.map(getKey)));
  const pageRef = useRef(initialPage);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const itemsRef = useRef<AnimeItem[]>(initialItems);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    seenRef.current = new Set(initialItems.map(getKey));
    pageRef.current = initialPage;
    hasMoreRef.current = true;
    itemsRef.current = initialItems;
  }, [initialItems, initialPage]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (!gridRef.current) return;
    const element = gridRef.current;
    const update = () => {
      const styles = window.getComputedStyle(element);
      const template = styles.gridTemplateColumns;
      if (!template) return;
      const count = template.split(" ").filter(Boolean).length;
      if (count > 0) setColumns(count);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return false;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const currentPage = pageRef.current;
      const url = new URL(fetchUrl, window.location.origin);
      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("perPage", String(perPage));
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Failed with ${res.status}`);
      }
      const json = await res.json();
      const incoming: AnimeItem[] = Array.isArray(json?.items)
        ? json.items
        : [];
      const unique = incoming.filter((item) => {
        const key = getKey(item);
        if (seenRef.current.has(key)) return false;
        seenRef.current.add(key);
        return true;
      });

      if (unique.length > 0) {
        setItems((prev) => [...prev, ...unique]);
      }

      const nextPage = currentPage + 1;
      pageRef.current = nextPage;
      setPage(nextPage);
      const nextHasMore = Boolean(json?.hasNextPage) && incoming.length > 0;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      return unique.length > 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      hasMoreRef.current = false;
      setHasMore(false);
      return false;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchUrl, perPage]);

  const targetRows = columns <= 2 ? minRows : maxRows;
  const targetItems = Math.max(columns * targetRows, 1);

  const ensureFilled = useCallback(async () => {
    let guard = 0;
    while (
      itemsRef.current.length < targetItems &&
      hasMoreRef.current &&
      guard < 6
    ) {
      const added = await fetchMore();
      if (!added) break;
      guard += 1;
    }
  }, [fetchMore, targetItems]);

  useEffect(() => {
    if (targetItems <= 0) return;
    if (itemsRef.current.length >= targetItems) return;
    if (!hasMoreRef.current) return;
    ensureFilled();
  }, [ensureFilled, targetItems]);

  const visibleItems = items.slice(0, targetItems);

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
        ) : error ? (
          <span className="text-xs text-rose-500">{error}</span>
        ) : null}
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Belum ada data untuk ditampilkan.
        </div>
      ) : (
        <div
          ref={gridRef}
          className="-mx-4 packed-grid px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
        >
          {visibleItems.map((anime) => (
            <AnimeCard
              key={`${anime.slug}-${anime.title}`}
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

      {loading ? (
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Filling grid...
        </p>
      ) : null}
    </section>
  );
}
