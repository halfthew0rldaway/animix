"use client";

import { useState, useEffect } from "react";

type MangaCoverProps = {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
};

const isValidImageUrl = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    // Check if it's a placeholder or invalid
    if (lower.includes("placeholder") ||
        lower.includes("lazy.jpg") ||
        lower.includes("noimage") ||
        lower.endsWith(".svg")) {
        return false;
    }
    return true;
};

export default function MangaCover({ src, alt, className = "", priority = false }: MangaCoverProps) {
    const [imgSrc, setImgSrc] = useState(() => {
        if (!isValidImageUrl(src)) {
            console.warn(`[MangaCover] Invalid initial src for ${alt}:`, src);
            return "/placeholder-manga.svg";
        }
        console.log(`[MangaCover] Loading ${alt}:`, src);
        return src;
    });
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (isValidImageUrl(src)) {
            setImgSrc(src);
            setAttempts(0);
        } else {
            setImgSrc("/placeholder-manga.svg");
        }
    }, [src]);

    const handleError = () => {
        if (attempts === 0) {
            // Try without query params
            const withoutQuery = src.split("?")[0];
            if (withoutQuery !== imgSrc) {
                setImgSrc(withoutQuery);
                setAttempts(1);
                return;
            }
        }

        if (attempts === 1) {
            // Try upgrading domain
            let upgraded = imgSrc;
            if (upgraded.includes("thumbnail.komiku.org")) {
                upgraded = upgraded.replace("thumbnail.komiku.org", "img.komiku.org");
            }
            if (upgraded !== imgSrc) {
                setImgSrc(upgraded);
                setAttempts(2);
                return;
            }
        }

        if (attempts === 2) {
            // Try replacing manga_thumbnail with manga_cover in filename
            const withCover = imgSrc.replace(/manga_thumbnail/g, "manga_cover");
            if (withCover !== imgSrc) {
                setImgSrc(withCover);
                setAttempts(3);
                return;
            }
        }

        if (attempts === 3) {
            // Try replacing with "cover" variant
            const withImage = imgSrc.replace(/thumbnail/gi, "image");
            if (withImage !== imgSrc) {
                setImgSrc(withImage);
                setAttempts(4);
                return;
            }
        }

        // Final fallback - only log warning once
        if (attempts >= 4) {
            console.warn(`[MangaCover] Image not available for ${alt}, using placeholder`);
            setImgSrc("/placeholder-manga.svg");
            setAttempts(5);
        } else {
            setAttempts(attempts + 1);
        }
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
            {...(priority ? { fetchPriority: "high" } : {})}
        />
    );
}
