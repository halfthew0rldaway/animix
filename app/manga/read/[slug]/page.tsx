"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getChapterPages } from "@/app/libs/manga-api";
import Link from "next/link";
import { MangaLoader } from "@/app/components/FancyLoaders";
import Footer from "@/app/components/Footer";

type PageProps = {
    params: Promise<{ slug: string }>;
};

export default function MangaReaderPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [chapterSlug, setChapterSlug] = useState<string>("");
    const [pages, setPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [chapterTitle, setChapterTitle] = useState("");
    const [scrollProgress, setScrollProgress] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const mangaSlug = searchParams.get("mangaSlug");
    const mangaTitle = searchParams.get("title");
    const mangaCover = searchParams.get("cover");

    useEffect(() => {
        const loadChapter = async (slug: string) => {
            setLoading(true);
            window.scrollTo(0, 0);

            const chapterData = await getChapterPages(slug);
            setPages(chapterData.images);
            const fetchedTitle = chapterData.title || chapterData.chapter || "";
            setChapterTitle(fetchedTitle);
            setLoading(false);

            // Save to History
            if (mangaSlug && mangaTitle) {
                try {
                    const historyItem = {
                        id: mangaSlug,
                        mangaSlug,
                        chapterSlug: slug,
                        title: mangaTitle,
                        cover: mangaCover || "",
                        chapter: chapterData.chapter || fetchedTitle || slug,
                        watchedAt: new Date().toISOString(),
                    };

                    const existing = localStorage.getItem("juju-otaku-manga-history");
                    let history = existing ? JSON.parse(existing) : [];

                    // Remove older entry for same manga
                    if (Array.isArray(history)) {
                        history = history.filter((h: any) => h.mangaSlug !== mangaSlug);
                        history.unshift(historyItem);
                        // Limit to 50 items
                        if (history.length > 50) history = history.slice(0, 50);
                        localStorage.setItem("juju-otaku-manga-history", JSON.stringify(history));
                    }
                } catch (e) {
                    console.error("Failed to save manga history", e);
                }
            }
        };

        params.then(({ slug }) => {
            setChapterSlug(slug);
            loadChapter(slug);
        });
    }, [params, mangaSlug, mangaTitle, mangaCover]);

    // Scroll progress and current page tracking
    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            setScrollProgress(scrolled);

            // Determine current page based on scroll position
            const pageElements = pageRefs.current;
            for (let i = pageElements.length - 1; i >= 0; i--) {
                const element = pageElements[i];
                if (element && element.getBoundingClientRect().top <= 100) {
                    setCurrentPage(i);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pages.length]);

    const handleBack = () => {
        if (mangaSlug) {
            router.push(`/manga/detail/${mangaSlug}`);
        } else {
            router.push('/manga');
        }
    };

    if (loading) {
        return <MangaLoader />;
    }

    return (
        <div className="manga-reader-comic">
            {/* Comic-Style Header */}
            <div className="manga-reader-comic-header animate-slide-down delay-200" style={{ animationFillMode: 'forwards' }}>
                <div className="manga-reader-comic-header-panel hover-lift">
                    <button onClick={handleBack} className="manga-reader-comic-back">
                        <span className="manga-reader-comic-back-arrow"><i className="fa-solid fa-arrow-left"></i></span>
                        <span className="manga-reader-comic-back-text">KEMBALI</span>
                    </button>

                    <div className="manga-reader-comic-title-panel">
                        <div className="manga-reader-comic-title-border"></div>
                        <div className="manga-reader-comic-title-content">
                            <div className="manga-reader-comic-manga-title">{mangaTitle}</div>
                            {chapterTitle && (
                                <div className="manga-reader-comic-chapter-title">{chapterTitle}</div>
                            )}
                        </div>
                    </div>

                    <Link href="/manga" className="manga-reader-comic-home">
                        <span className="manga-reader-comic-home-icon"><i className="fa-solid fa-house"></i></span>
                        <span className="manga-reader-comic-home-text">BERANDA</span>
                    </Link>
                </div>

                {/* Progress Bar */}
                <div className="manga-reader-comic-progress-container">
                    <div
                        className="manga-reader-comic-progress-bar"
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>
            </div>

            {/* Page Counter Badge */}
            <div className="manga-reader-page-counter">
                <div className="manga-reader-page-counter-panel">
                    <div className="manga-reader-page-counter-border"></div>
                    <div className="manga-reader-page-counter-content">
                        <span className="manga-reader-page-current">{currentPage + 1}</span>
                        <span className="manga-reader-page-separator">/</span>
                        <span className="manga-reader-page-total">{pages.length}</span>
                    </div>
                </div>
            </div>

            {/* Comic Pages */}
            <div className="manga-reader-comic-pages">
                {pages.length > 0 ? (
                    pages.map((page, index) => (
                        <div
                            key={index}
                            ref={(el) => { pageRefs.current[index] = el; }}
                            className="manga-reader-comic-page-wrapper animate-fade-in opacity-0"
                            style={{ animationDelay: `${Math.min(index * 100, 800)}ms`, animationFillMode: 'forwards' }}
                        >
                            <div className="manga-reader-comic-page-panel">
                                <div className="manga-reader-comic-page-border"></div>
                                <div className="manga-reader-comic-page-content">
                                    <img
                                        src={page}
                                        alt={`Page ${index + 1}`}
                                        loading={index < 3 ? "eager" : "lazy"}
                                        className="manga-reader-comic-page-image"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder-manga.svg';
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Page Number Overlay */}
                            <div className="manga-reader-page-number">
                                <div className="manga-reader-page-number-badge">
                                    HAL {index + 1}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="manga-reader-comic-empty">
                        <div className="manga-reader-comic-empty-panel">
                            <div className="manga-loading-spinner"></div>
                            <div className="loading-text">MOHON TUNGGU...</div>
                            <p>TIDAK ADA HALAMAN</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Comic-Style Footer */}
            <div className="manga-reader-comic-footer animate-slide-up delay-300" style={{ animationFillMode: 'forwards' }}>
                <div className="manga-reader-comic-footer-panel hover-lift">
                    <div className="manga-reader-comic-footer-border"></div>
                    <div className="manga-reader-comic-footer-content">
                        <div className="manga-reader-comic-footer-info">
                            <div className="manga-reader-comic-footer-title">{chapterTitle || "MEMBACA..."}</div>
                            <div className="manga-reader-comic-footer-pages">{pages.length} HALAMAN</div>
                        </div>
                        <button onClick={handleBack} className="manga-reader-comic-footer-btn">
                            <span>DAFTAR BAB</span>
                            <span className="manga-reader-comic-footer-arrow"><i className="fa-solid fa-list"></i></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comic Footer */}
            <Footer variant="comic" />
        </div>
    );
}
