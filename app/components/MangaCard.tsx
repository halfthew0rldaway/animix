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
            className="manga-card group"
        >
            <div className="manga-card-inner">
                <div className="manga-card-cover">
                    <img
                        src={src}
                        alt={manga.title}
                        className="manga-card-image"
                        loading="lazy"
                        onError={handleError}
                    />
                    <div className="manga-card-overlay">
                        <div className="manga-card-badge">BACA</div>
                    </div>
                </div>
                <div className="manga-card-content">
                    <h3 className="manga-card-title">{manga.title}</h3>
                    {manga.status && (
                        <span className="manga-card-status">
                            {manga.status.toLowerCase() === "ongoing" ? "BERLANJUT" :
                                manga.status.toLowerCase().includes("complete") ? "TAMAT" :
                                    manga.status.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>
            <div className="manga-card-shadow" />
        </Link>
    );
}
