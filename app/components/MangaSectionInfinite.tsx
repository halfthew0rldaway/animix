"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MangaItem } from "../libs/manga-api";
import MangaCard from "./MangaCard";

type MangaSectionInfiniteProps = {
  title: string;
  caption?: string;
  initialMangas: MangaItem[];
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

const getKey = (item: MangaItem) => normalize(item.slug || item.title || "untitled");

const dedupe = (items: MangaItem[]) => {
  const seen = new Set<string>();
  const result: MangaItem[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

const isLikelyBadCover = (url?: string) => {
  if (!url) return true;
  const lowered = url.toLowerCase();
  if (
    lowered.includes("placeholder") ||
    lowered.includes("noimage") ||
    lowered.includes("default") ||
    lowered.includes("blank") ||
    lowered.endsWith(".svg")
  ) {
    return true;
  }
  return false;
};

export default function MangaSectionInfinite({
  title,
  caption,
  initialMangas,
  warning,
  fetchUrl = "/api/manga-feed",
  perPage = 24,
  initialPage = 1,
  minRows = 2,
  maxRows = 3,
}: MangaSectionInfiniteProps) {
  const initialItems = useMemo(() => dedupe(initialMangas), [initialMangas]);
  const [items, setItems] = useState<MangaItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const seenRef = useRef<Set<string>>(new Set(initialItems.map(getKey)));
  const pageRef = useRef(initialPage);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const itemsRef = useRef<MangaItem[]>(initialItems);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const filtered = initialItems.filter((item) => !isLikelyBadCover(item.cover));
    const nextItems = filtered.length > 0 ? filtered : initialItems;
    setItems(nextItems);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    seenRef.current = new Set(nextItems.map(getKey));
    pageRef.current = initialPage;
    hasMoreRef.current = true;
    itemsRef.current = nextItems;
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
    if (loadingRef.current || !hasMoreRef.current) return 0;
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
      const incoming: MangaItem[] = Array.isArray(json?.items) ? json.items : [];
      const deduped = incoming.filter((item) => {
        const key = getKey(item);
        if (seenRef.current.has(key)) return false;
        seenRef.current.add(key);
        return true;
      });
      const filtered = deduped.filter((item) => !isLikelyBadCover(item.cover));
      const toAppend = filtered.length > 0 ? filtered : deduped;
      if (toAppend.length > 0) {
        setItems((prev) => [...prev, ...toAppend]);
      }

      const nextPage = currentPage + 1;
      pageRef.current = nextPage;
      setPage(nextPage);
      const nextHasMore = Boolean(json?.hasNextPage) && incoming.length > 0;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      return toAppend.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      hasMoreRef.current = false;
      setHasMore(false);
      return 0;
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
      guard < 8
    ) {
      await fetchMore();
      guard += 1;
    }
  }, [fetchMore, targetItems]);

  useEffect(() => {
    if (targetItems <= 0) return;
    if (itemsRef.current.length >= targetItems) return;
    if (!hasMoreRef.current) return;
    ensureFilled();
  }, [ensureFilled, targetItems, items.length]);

  const visibleItems = items.slice(0, targetItems);

  const handleImageError = useCallback((slug: string) => {
    setItems((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  return (
    <section className="manga-section">
      <div className="manga-section-header">
        <div className="manga-section-title-wrapper">
          <h2 className="manga-section-title">{title}</h2>
          <div className="manga-section-accent" />
        </div>
        {caption ? <p className="manga-section-caption">{caption}</p> : null}
      </div>

      {warning ? (
        <div className="manga-section-warning">
          <p>{warning}</p>
        </div>
      ) : visibleItems.length > 0 ? (
        <div ref={gridRef} className="manga-grid">
          {visibleItems.map((manga) => (
            <MangaCard
              key={manga.id}
              manga={manga}
              onImageError={handleImageError}
            />
          ))}
        </div>
      ) : (
        <div className="manga-section-empty">
          <p>No comics available</p>
        </div>
      )}

      {loading ? (
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Filling grid...
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-rose-500">{error}</p>
      ) : null}
    </section>
  );
}
