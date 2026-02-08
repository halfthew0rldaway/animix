"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const HISTORY_KEY = "juju-otaku-manga-history";

type MangaHistoryItem = {
    id: string;
    mangaSlug: string;
    chapterSlug: string;
    title: string;
    cover?: string;
    chapter: string;
    watchedAt?: string;
};

type HistoryListProps = {
    title?: string;
    limit?: number;
};

export default function MangaHistoryList({
    title = "Continue Reading",
    limit = 20,
}: HistoryListProps) {
    const { data: session } = useSession();
    const useDatabase = process.env.NEXT_PUBLIC_USE_DATABASE === "true";

    const [items, setItems] = useState<MangaHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load from local storage
        const loadLocal = () => {
            try {
                const raw = localStorage.getItem(HISTORY_KEY);
                const parsed = raw ? (JSON.parse(raw) as MangaHistoryItem[]) : [];
                setItems(Array.isArray(parsed) ? parsed.slice(0, limit) : []);
            } catch (e) {
                console.error("Failed to load history", e);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        loadLocal();
    }, [limit]);

    const hasItems = items.length > 0;

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-black uppercase text-[#1a1510] dark:text-[#fff0e0]">
                    {title}
                </h2>
            </div>

            {loading ? (
                <div className="manga-panel p-8 text-center text-sm uppercase tracking-[0.2em] opacity-60">
                    Loading history...
                </div>
            ) : hasItems ? (
                <div className="manga-grid">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/manga/read/${item.chapterSlug}?mangaSlug=${item.mangaSlug}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover || "")}`}
                            className="manga-card group"
                        >
                            <div className="manga-card-inner">
                                <div className="manga-card-cover">
                                    {item.cover ? (
                                        <img
                                            src={item.cover}
                                            alt={item.title}
                                            className="manga-card-image"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                    <div className="manga-card-overlay">
                                        <div className="manga-card-badge">CH. {item.chapter}</div>
                                    </div>
                                </div>
                                <div className="manga-card-content">
                                    <h3 className="manga-card-title">{item.title}</h3>
                                    <span className="manga-card-status">Continue</span>
                                </div>
                            </div>
                            <div className="manga-card-shadow" />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="manga-panel p-8 text-center">
                    <p className="text-[#1a1510]/60 dark:text-[#fff0e0]/60">No reading history yet.</p>
                </div>
            )}
        </section>
    );
}
