"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";

interface MangaItem {
    id: string;
    title: string;
    cover: string;
    description?: string;
    status?: string;
    type?: string;
    rating?: string;
    author?: string;
    genres?: string[];
    slug: string;
}

interface InfiniteScrollListProps {
    initialItems: MangaItem[];
    fetchMoreAction: (page: number) => Promise<{ items: MangaItem[], hasNext: boolean }>;
    hasNextPage: boolean;
}

export default function InfiniteScrollList({ initialItems, fetchMoreAction, hasNextPage }: InfiniteScrollListProps) {
    const [items, setItems] = useState<MangaItem[]>(initialItems);
    const [hasMore, setHasMore] = useState(hasNextPage);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(2);
    const { ref, inView } = useInView();

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const { items: newItems, hasNext } = await fetchMoreAction(page);

            if (newItems.length > 0) {
                setItems(prev => {
                    // Helper to dedupe
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
                setPage(prev => prev + 1);
                setHasMore(hasNext);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.error("Failed to load more", e);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, fetchMoreAction]);

    useEffect(() => {
        if (inView) {
            loadMore();
        }
    }, [inView, loadMore]);

    return (
        <>
            <div className="manga-grid">
                {items.map((manga) => (
                    <Link
                        key={manga.id}
                        href={`/manga/detail/${manga.slug}`}
                        className="manga-card group"
                    >
                        <div className="manga-card-inner">
                            <div className="manga-card-cover">
                                <img
                                    src={manga.cover}
                                    alt={manga.title}
                                    className="manga-card-image"
                                    loading="lazy"
                                />
                                <div className="manga-card-overlay">
                                    <div className="manga-card-badge">{manga.type || "Comic"}</div>
                                </div>
                            </div>
                            <div className="manga-card-content">
                                <h3 className="manga-card-title">{manga.title}</h3>
                                {manga.status && (
                                    <span className="manga-card-status">{manga.status}</span>
                                )}
                            </div>
                        </div>
                        <div className="manga-card-shadow" />
                    </Link>
                ))}
            </div>

            {hasMore && (
                <div ref={ref} className="manga-panel mt-8 flex w-full items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ea580c] border-t-transparent"></div>
                        <p className="text-sm font-bold uppercase tracking-widest text-[#ea580c]">Loading more comics...</p>
                    </div>
                </div>
            )}

            {!hasMore && items.length > 0 && (
                <div className="manga-panel mt-8 p-8 text-center opacity-60">
                    <p className="uppercase tracking-widest text-[#1a1510] dark:text-[#fff0e0]">You&apos;ve reached the end</p>
                </div>
            )}
        </>
    );
}
