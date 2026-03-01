"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

interface DonghuaListClientProps {
    initialItems: ApiDonghuaItem[];
    fetchMoreAction?: (page: number) => Promise<{ items: ApiDonghuaItem[], hasNext: boolean }>;
    hasNextPage: boolean;
    initialLetter?: string | null;
    initialPage?: number;
}

export default function DonghuaListClient({ initialItems, fetchMoreAction, hasNextPage, initialLetter }: DonghuaListClientProps) {
    const [items, setItems] = useState<ApiDonghuaItem[]>(initialItems);
    const [hasMore, setHasMore] = useState(hasNextPage);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(2);

    // Reset state if letter prop changes (though next.js handles this via key prop usually)
    const [letter, setLetter] = useState(initialLetter);
    if (initialLetter !== letter) {
        setLetter(initialLetter);
        setItems(initialItems);
        setHasMore(hasNextPage);
        setPage(2);
        setLoading(false);
    }

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore || !fetchMoreAction) return;
        setLoading(true);

        try {
            const { items: newItems, hasNext } = await fetchMoreAction(page);

            if (newItems.length > 0) {
                setItems(prev => {
                    const existingIds = new Set(prev.map(p => p.slug));
                    const uniqueNew = newItems.filter(p => !existingIds.has(p.slug));
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
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && hasMore) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [loading, hasMore, loadMore]);

    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[#5c5852] dark:text-[#a09c95]">
                <div className="mb-4 text-4xl">📜</div>
                <p className="uppercase tracking-widest text-sm font-bold">Arsip Kosong {letter ? `(Huruf ${letter})` : ""}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12 w-full">
            <div className="-mx-4 packed-grid px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
                {items.map((item) => (
                    <DonghuaCard
                        key={`${item.slug}-${item.title}`}
                        slug={item.slug}
                        title={item.title}
                        poster={item.poster}
                        episode={item.episode}
                        type={item.type}
                        releaseDay={item.release_day}
                        synopsis={item.synopsis}
                        studio={item.studio}
                    />
                ))}
            </div>

            {hasMore && fetchMoreAction && (
                <div ref={sentinelRef} className="flex justify-center pb-8 border-t border-[#e5dcd3] dark:border-[#3a3836] pt-8">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#8a857e] animate-pulse">
                        Retrieving from archive...
                    </p>
                </div>
            )}

            {!hasMore && items.length > 0 && !loading && (
                <div className="flex justify-center pb-8 border-t border-[#e5dcd3] dark:border-[#3a3836] pt-8">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#8a857e]">
                        End of records
                    </p>
                </div>
            )}
        </div>
    );
}
