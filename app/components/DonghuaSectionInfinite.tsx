"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DonghuaCard from "./DonghuaCard";

type ApiDonghuaItem = {
    slug: string;
    title: string;
    poster: string;
    episode?: string | number | null;
    type?: string | null;
    release_day?: string | null;
    synopsis?: string | null;
    studio?: string | null;
};

type DonghuaSectionInfiniteProps = {
    title: string;
    caption?: string;
    initialDonghuas?: ApiDonghuaItem[];
    minRows?: number;
    maxRows?: number;
    fetchUrl?: string;
    perPage?: number;
    initialPage?: number;
};

const normalize = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const getKey = (item: ApiDonghuaItem) =>
    normalize(item.slug || item.title || "untitled");

const dedupe = (items: ApiDonghuaItem[]) => {
    const seen = new Set<string>();
    const result: ApiDonghuaItem[] = [];
    for (const item of items) {
        const key = getKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }
    return result;
};

export default function DonghuaSectionInfinite({
    title,
    caption,
    initialDonghuas = [],
    fetchUrl = "/api/donghua",
    perPage = 18,
    initialPage = 1,
    minRows = 2,
    maxRows = 3,
}: DonghuaSectionInfiniteProps) {
    const initialItems = useMemo(() => dedupe(initialDonghuas), [initialDonghuas]);
    const [items, setItems] = useState<ApiDonghuaItem[]>(initialItems);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const gridRef = useRef<HTMLDivElement | null>(null);
    const seenRef = useRef<Set<string>>(new Set(initialItems.map(getKey)));
    const pageRef = useRef(initialPage);
    const hasMoreRef = useRef(true);
    const loadingRef = useRef(false);
    const itemsRef = useRef<ApiDonghuaItem[]>(initialItems);
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
                throw new Error(`Failed to load archive data. (${res.status})`);
            }
            const json = await res.json();
            const incoming: ApiDonghuaItem[] = Array.isArray(json?.items)
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

            const nextHasMore = Boolean(json?.hasNextPage) || incoming.length > 0;
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
        <section className="flex flex-col gap-12 font-serif text-[#1c1b1a] dark:text-[#dbd7d2]">
            <div className="flex flex-col items-center gap-4 text-center">
                <h2 className="text-3xl font-normal tracking-wide italic decoration-1 underline-offset-8 decoration-[#8a857e]" style={{ textDecorationStyle: 'dashed' }}>
                    {title}
                </h2>
                {caption ? (
                    <p className="max-w-md text-sm text-[#716c64] dark:text-[#a09c95]">
                        {caption}
                    </p>
                ) : null}
                {error ? (
                    <div className="mt-4 border border-[#e5dcd3] bg-[#fbf9f6] px-6 py-3 text-sm text-[#8a3a3a] dark:border-[#3a3836] dark:bg-[#1f1d1c]">
                        {error}
                    </div>
                ) : null}
            </div>

            {visibleItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e5dcd3] p-10 text-center text-sm font-sans tracking-widest text-[#a09c95] dark:border-[#3a3836]">
                    Arsip kosong.
                </div>
            ) : (
                <div
                    ref={gridRef}
                    className="-mx-4 packed-grid px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
                >
                    {visibleItems.map((anime) => (
                        <DonghuaCard
                            key={`${anime.slug}-${anime.title}`}
                            slug={anime.slug}
                            title={anime.title}
                            poster={anime.poster}
                            episode={anime.episode}
                            type={anime.type}
                            releaseDay={anime.release_day}
                            synopsis={anime.synopsis}
                            studio={anime.studio}
                        />
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-6">
                    <span className="animate-pulse text-xs font-sans uppercase tracking-[0.3em] text-[#a09c95]">
                        Opening archive...
                    </span>
                </div>
            ) : null}
        </section>
    );
}
