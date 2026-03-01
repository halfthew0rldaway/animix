"use client";

import { use as usePromise, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { notifyRateLimit, updateRateLimitUsage } from "../../../libs/rateLimitClient";
import { AnimeLoader } from "@/app/components/FancyLoaders";

const HISTORY_KEY = "animix-donghua-history";
const SESSION_DONGHUA_KEY = "animix-donghua-current";

type StreamItem = {
    name?: string;
    url: string;
};

type EpisodeData = {
    title?: string;
    streams?: StreamItem[];
};

export default function DonghuaWatchPage({
    params,
}: {
    params: Promise<{ episodeSlug: string }>;
}) {
    const { episodeSlug } = usePromise(params);
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const useDatabase = process.env.NEXT_PUBLIC_USE_DATABASE === "true";

    const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
    const [currentStream, setCurrentStream] = useState<StreamItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // We could implement prev/next if we have episode list or rely on simple parsing like Anime
    // But Donghua slugs often don't follow strict patterns. We'll leave naive parsing for now.
    const [prevSlug, setPrevSlug] = useState<string | null>(null);
    const [nextSlug, setNextSlug] = useState<string | null>(null);

    const donghuaContext = useMemo(() => {
        const fromQuery = {
            slug: searchParams.get("slug") ?? "",
            title: searchParams.get("title") ?? "",
            image: searchParams.get("image") ?? "",
        };

        if (fromQuery.slug || fromQuery.title || fromQuery.image) {
            if (typeof window !== "undefined") {
                sessionStorage.setItem(SESSION_DONGHUA_KEY, JSON.stringify(fromQuery));
            }
            return fromQuery;
        }

        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem(SESSION_DONGHUA_KEY);
            if (stored) {
                try {
                    return JSON.parse(stored) as typeof fromQuery;
                } catch {
                    return fromQuery;
                }
            }
        }

        return fromQuery;
    }, [searchParams]);

    useEffect(() => {
        const loadEpisode = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/donghua/episode?slug=${encodeURIComponent(episodeSlug)}`);
                const waitHeader = res.headers.get("x-animix-rate-limit-wait");
                const usedHeader = res.headers.get("x-animix-rate-limit-used");
                const limitHeader = res.headers.get("x-animix-rate-limit-limit");
                const windowHeader = res.headers.get("x-animix-rate-limit-window");
                if (usedHeader && limitHeader) {
                    const used = Number(usedHeader);
                    const limit = Number(limitHeader);
                    const windowMs = windowHeader ? Number(windowHeader) : undefined;
                    updateRateLimitUsage(used, limit, "donghua-episode", windowMs);
                }
                if (waitHeader) {
                    const waitMs = Number(waitHeader);
                    if (!Number.isNaN(waitMs) && waitMs > 0) {
                        notifyRateLimit(waitMs, "donghua-episode");
                    }
                }
                if (!res.ok) {
                    throw new Error(`Failed with ${res.status}`);
                }
                const parsed = (await res.json()) as EpisodeData;

                setEpisodeData(parsed);
                const firstStream = parsed.streams?.[0] ?? null;
                setCurrentStream(firstStream);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal memuat episode Donghua");
            } finally {
                setLoading(false);
            }
        };

        loadEpisode();
    }, [episodeSlug]);

    useEffect(() => {
        if (episodeData?.title) {
            document.title = `${episodeData.title} - Donghua`;
        }
    }, [episodeData?.title]);

    useEffect(() => {
        const match = episodeSlug.match(/-episode-(\d+)/);
        if (!match) return;

        const currentNumber = Number(match[1]);
        if (Number.isNaN(currentNumber)) return;

        // simplistic naive slug increment/decrement
        const base = episodeSlug.replace(/-episode-\d+.*$/, "");
        const rest = episodeSlug.match(/-episode-\d+(.*)$/)?.[1] || "";
        const prev = currentNumber > 1 ? `${base}-episode-${String(currentNumber - 1).padStart(2, '0')}${rest}` : null;
        const next = `${base}-episode-${String(currentNumber + 1).padStart(2, '0')}${rest}`;

        setPrevSlug(prev);
        setNextSlug(next);

    }, [episodeSlug]);

    useEffect(() => {
        if (!episodeData || !episodeData.title) return;

        const saveHistory = async () => {
            const payload = {
                animeId: donghuaContext.slug || null,
                episodeId: episodeSlug,
                title: donghuaContext.title || episodeData.title || episodeSlug,
                image: donghuaContext.image || null,
            };

            if (useDatabase && session?.user) {
                // We reuse the /api/history but it logs interchangeably.
                // As long as animeId and episodeId match, it functions.
                await fetch("/api/history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                return;
            }

            const historyItem = {
                id: `${episodeSlug}-${Date.now()}`,
                ...payload,
                watchedAt: new Date().toISOString(),
            };

            const existing = typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
                : [];

            const filtered = Array.isArray(existing)
                ? existing.filter((item) => item?.episodeId !== episodeSlug)
                : [];

            const updated = [historyItem, ...filtered].slice(0, 50);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        };

        saveHistory();
    }, [episodeData, episodeSlug, donghuaContext, useDatabase, session?.user]);

    const streamList = episodeData?.streams ?? [];

    return (
        <div className="min-h-screen bg-[#f7f5f0] text-[#1c1b1a] dark:bg-[#151413] dark:text-[#dbd7d2] font-serif transition-colors duration-300">
            <Navbar />
            <main className="mx-auto flex w-full flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-[#8a857e]">
                            ARCHIVE TRANSMISSION
                        </p>
                        <h1 className="text-2xl lg:text-3xl font-medium tracking-[0.1em] text-[#2c2a27] dark:text-[#e0dbd3] font-[family-name:Georgia,serif]">
                            {episodeData?.title ?? "MENGHUBUNGKAN ARSIP..."}
                        </h1>
                        <p className="text-sm text-[#5c5852] dark:text-[#a09c95]">
                            {donghuaContext.title || donghuaContext.slug || "ARSIP TIDAK DIKETAHUI"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={donghuaContext.slug ? `/donghua/detail/${encodeURIComponent(donghuaContext.slug)}` : "/donghua"}
                            className="rounded-lg border border-[#c2baab] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-[#5c5852] transition hover:-translate-y-[1px] hover:border-[#8a857e] active:translate-y-0 dark:border-[#5c5852] dark:text-[#8a857e] dark:hover:border-[#a09c95] font-sans"
                        >
                            KEMBALI KE DETAIL
                        </Link>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-xl border border-[#e5dcd3] bg-[#fbf9f6] p-4 text-sm text-[#8a3a3a] dark:border-[#3a3836] dark:bg-[#1f1d1c]">
                        {error}. Coba server lain atau muat ulang.
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-2xl border-4 border-[#e5dcd3] bg-[#1a1918] shadow-2xl dark:border-[#3a3836] relative z-10 mx-auto w-full">
                    {currentStream?.url ? (
                        <iframe
                            title={episodeData?.title ?? "Stream"}
                            src={currentStream.url}
                            className="aspect-video w-full"
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex aspect-video w-full items-center justify-center bg-[#1a1918]">
                            {loading ? <AnimeLoader /> : (
                                <div className="text-sm text-[#8a857e] uppercase tracking-widest font-sans font-bold">STREAM TIDAK TERSEDIA</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Server Selection */}
                <div className="rounded-2xl border border-[#e5dcd3] bg-[#fbf9f6] p-6 shadow-sm dark:border-[#3a3836] dark:bg-[#1a1918]">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#2c2a27] dark:text-[#e0dbd3] font-sans">
                        SUMBER ARSIP (SERVER)
                    </h2>
                    <p className="mt-2 text-xs text-[#716c64] dark:text-[#8a857e] font-serif italic">
                        Silakan pilih sumber lain apabila arsip saat ini rusak atau gagal dimuat.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        {streamList.map((stream, index) => (
                            <button
                                key={`${stream.url}-${index}`}
                                type="button"
                                onClick={() => setCurrentStream(stream)}
                                className={`rounded-xl border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] font-sans transition-all active:scale-95 ${currentStream?.url === stream.url
                                    ? "border-[#2c2a27] bg-[#2c2a27] text-[#e0dbd3] shadow-md dark:border-[#dbd7d2] dark:bg-[#dbd7d2] dark:text-[#1c1b1a]"
                                    : "border-[#e5dcd3] text-[#5c5852] hover:border-[#8a857e] hover:bg-[#e5dcd3]/30 dark:border-[#3a3836] dark:text-[#a09c95] dark:hover:border-[#5c5852]"
                                    }`}
                            >
                                {stream.name ?? `Server ${index + 1}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prev / Next manual controls */}
                <div className="flex justify-between items-center w-full gap-4 pb-12">
                    {prevSlug ? (
                        <Link
                            href={`/donghua/watch/${encodeURIComponent(prevSlug)}?slug=${encodeURIComponent(donghuaContext.slug)}&title=${encodeURIComponent(donghuaContext.title)}&image=${encodeURIComponent(donghuaContext.image)}`}
                            className="group flex flex-1 items-center justify-center gap-2 border border-[#e5dcd3] bg-transparent hover:bg-[#e5dcd3]/50 dark:border-[#3a3836] dark:hover:bg-[#3a3836]/50 p-4 transition-all"
                        >
                            <span className="text-xs uppercase tracking-widest text-[#5c5852] dark:text-[#8a857e] font-sans font-bold">⬅ EPS SEBELUMNYA</span>
                        </Link>
                    ) : <div className="flex-1" />}

                    {nextSlug ? (
                        <Link
                            href={`/donghua/watch/${encodeURIComponent(nextSlug)}?slug=${encodeURIComponent(donghuaContext.slug)}&title=${encodeURIComponent(donghuaContext.title)}&image=${encodeURIComponent(donghuaContext.image)}`}
                            className="group flex flex-1 items-center justify-center gap-2 border border-[#e5dcd3] bg-transparent hover:bg-[#e5dcd3]/50 dark:border-[#3a3836] dark:hover:bg-[#3a3836]/50 p-4 transition-all"
                        >
                            <span className="text-xs uppercase tracking-widest text-[#5c5852] dark:text-[#8a857e] font-sans font-bold">EPS SELANJUTNYA ➡</span>
                        </Link>
                    ) : <div className="flex-1" />}
                </div>
            </main>
            <Footer />
        </div>
    );
}
