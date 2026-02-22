"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MangaItem } from "../libs/manga-api";

type MangaCardProps = {
    manga: MangaItem;
    onImageError?: (slug: string) => void;
};

const upgradeCoverUrl = (url: string) => {
    if (!url) return url;
    let next = url;
    if (next.includes("thumbnail.komiku.org")) {
        next = next.replace("thumbnail.komiku.org", "img.komiku.org");
    }
    if (next.includes("?resize=")) {
        next = next.split("?")[0];
    }
    return next;
};

export default function MangaCard({ manga, onImageError }: MangaCardProps) {
    const [src, setSrc] = useState(manga.cover);
    const attemptsRef = useRef(0);

    useEffect(() => {
        setSrc(manga.cover);
        attemptsRef.current = 0;
    }, [manga.cover]);

    const handleError = () => {
        if (attemptsRef.current === 0) {
            attemptsRef.current += 1;
            const upgraded = upgradeCoverUrl(src);
            if (upgraded && upgraded !== src) {
                setSrc(upgraded);
                return;
            }
        }
        if (attemptsRef.current === 1) {
            attemptsRef.current += 1;
            const stripped = src.split("?")[0];
            if (stripped && stripped !== src) {
                setSrc(stripped);
                return;
            }
        }
        onImageError?.(manga.slug);
    };

    return (
        <Link
            href={`/manga/detail/${manga.slug}?cover=${encodeURIComponent(src)}`}
            className="group flex flex-col overflow-hidden bg-[var(--manga-bg)] border-2 border-[var(--manga-border)] rounded-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--manga-accent)]"
        >
            <div className="relative aspect-[2/3] overflow-hidden border-b-2 border-[var(--manga-border)]">
                <img
                    src={src}
                    alt={manga.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={handleError}
                />

                {manga.status && (
                    <div className="absolute top-2 left-2">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[2px_2px_0_rgba(0,0,0,1)] border border-black ${manga.status.toLowerCase() === "ongoing" ? "bg-green-600" : "bg-black"
                            }`}>
                            {manga.status.toLowerCase() === "ongoing" ? "Lanjut" :
                                manga.status.toLowerCase().includes("complete") ? "Tamat" :
                                    manga.status}
                        </span>
                    </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3 bg-[var(--manga-panel-bg)]">
                <h3
                    className="text-sm font-bold text-[var(--manga-fg)] leading-snug group-hover:text-[var(--manga-accent)] transition-colors"
                    style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {manga.title}
                </h3>
            </div>
        </Link>
    );
}
