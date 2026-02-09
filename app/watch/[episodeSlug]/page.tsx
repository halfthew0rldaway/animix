"use client";

import { use as usePromise, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { notifyRateLimit, updateRateLimitUsage } from "../../libs/rateLimitClient";
import { AnimeLoader } from "@/app/components/FancyLoaders";

const HISTORY_KEY = "juju-otaku-history";
const SESSION_ANIME_KEY = "juju-otaku-current";

type StreamItem = {
  name?: string;
  url: string;
};

type EpisodeData = {
  title?: string;
  streams?: StreamItem[];
};

type EpisodeResponse = {
  title?: string;
  streams?: StreamItem[];
  data?: EpisodeData;
  result?: EpisodeData;
};

const extractEpisode = (payload: EpisodeResponse): EpisodeData => {
  if (payload.streams || payload.title) {
    return { title: payload.title, streams: payload.streams };
  }
  if (payload.data) return payload.data;
  if (payload.result) return payload.result;
  return {};
};

export default function WatchPage({
  params,
}: {
  params: Promise<{ episodeSlug: string }>;
}) {
  const { episodeSlug } = usePromise(params);
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const useDatabase = process.env.NEXT_PUBLIC_USE_DATABASE === "true";
  const enableEpisodeCheck =
    process.env.NEXT_PUBLIC_ENABLE_EPISODE_CHECK === "true";

  const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
  const [currentStream, setCurrentStream] = useState<StreamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const animeContext = useMemo(() => {
    const fromQuery = {
      slug: searchParams.get("slug") ?? "",
      title: searchParams.get("title") ?? "",
      image: searchParams.get("image") ?? "",
    };

    if (fromQuery.slug || fromQuery.title || fromQuery.image) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_ANIME_KEY, JSON.stringify(fromQuery));
      }
      return fromQuery;
    }

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(SESSION_ANIME_KEY);
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
        const res = await fetch(`/api/episode?slug=${encodeURIComponent(episodeSlug)}`);
        const waitHeader = res.headers.get("x-animix-rate-limit-wait");
        const usedHeader = res.headers.get("x-animix-rate-limit-used");
        const limitHeader = res.headers.get("x-animix-rate-limit-limit");
        const windowHeader = res.headers.get("x-animix-rate-limit-window");
        if (usedHeader && limitHeader) {
          const used = Number(usedHeader);
          const limit = Number(limitHeader);
          const windowMs = windowHeader ? Number(windowHeader) : undefined;
          updateRateLimitUsage(used, limit, "episode", windowMs);
        }
        if (waitHeader) {
          const waitMs = Number(waitHeader);
          if (!Number.isNaN(waitMs) && waitMs > 0) {
            notifyRateLimit(waitMs, "episode");
          }
        }
        if (!res.ok) {
          throw new Error(`Failed with ${res.status}`);
        }
        const json = (await res.json()) as EpisodeResponse;
        const parsed = extractEpisode(json);
        setEpisodeData(parsed);
        const firstStream = parsed.streams?.[0] ?? null;
        setCurrentStream(firstStream);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load episode");
      } finally {
        setLoading(false);
      }
    };

    loadEpisode();
  }, [episodeSlug]);

  useEffect(() => {
    if (episodeData?.title) {
      document.title = `${episodeData.title} - Animix`;
    }
  }, [episodeData?.title]);

  useEffect(() => {
    const match = episodeSlug.match(/-episode-(\d+)$/);
    if (!match) {
      setPrevSlug(null);
      setNextSlug(null);
      setHasPrev(false);
      setHasNext(false);
      return;
    }

    const currentNumber = Number(match[1]);
    if (Number.isNaN(currentNumber)) return;

    const base = episodeSlug.replace(/-episode-\d+$/, "");
    const prev = currentNumber > 1 ? `${base}-episode-${currentNumber - 1}` : null;
    const next = `${base}-episode-${currentNumber + 1}`;

    setPrevSlug(prev);
    setNextSlug(next);

    if (!enableEpisodeCheck) {
      setHasPrev(Boolean(prev));
      setHasNext(Boolean(next));
      return;
    }

    const checkExists = async (slug: string | null, setter: (val: boolean) => void) => {
      if (!slug) {
        setter(false);
        return;
      }
      try {
        const res = await fetch(`/api/episode/exists?slug=${encodeURIComponent(slug)}`);
        const waitHeader = res.headers.get("x-animix-rate-limit-wait");
        const usedHeader = res.headers.get("x-animix-rate-limit-used");
        const limitHeader = res.headers.get("x-animix-rate-limit-limit");
        const windowHeader = res.headers.get("x-animix-rate-limit-window");
        if (usedHeader && limitHeader) {
          const used = Number(usedHeader);
          const limit = Number(limitHeader);
          const windowMs = windowHeader ? Number(windowHeader) : undefined;
          updateRateLimitUsage(used, limit, "episode-check", windowMs);
        }
        if (waitHeader) {
          const waitMs = Number(waitHeader);
          if (!Number.isNaN(waitMs) && waitMs > 0) {
            notifyRateLimit(waitMs, "episode-check");
          }
        }
        if (!res.ok) {
          setter(false);
          return;
        }
        const data = (await res.json()) as { ok?: boolean };
        setter(Boolean(data.ok));
      } catch {
        setter(false);
      }
    };

    checkExists(prev, setHasPrev);
    checkExists(next, setHasNext);
  }, [episodeSlug]);

  useEffect(() => {
    if (!episodeData || !episodeData.title) return;

    const saveHistory = async () => {
      const payload = {
        animeId: animeContext.slug || null,
        episodeId: episodeSlug,
        title: animeContext.title || episodeData.title || episodeSlug,
        image: animeContext.image || null,
      };

      if (useDatabase && session?.user) {
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
  }, [episodeData, episodeSlug, animeContext, useDatabase, session?.user]);

  const streamList = episodeData?.streams ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              NONTON
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              {episodeData?.title ?? "MEMUAT EPISODE..."}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {animeContext.title || animeContext.slug || "SEDANG DIPUTAR."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {prevSlug && hasPrev ? (
              <Link
                href={`/watch/${encodeURIComponent(prevSlug)}`}
                className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:-translate-y-[1px] hover:border-zinc-400 active:translate-y-0 dark:border-zinc-800 dark:text-zinc-200"
              >
                SEBELUMNYA
              </Link>
            ) : null}
            {nextSlug && hasNext ? (
              <Link
                href={`/watch/${encodeURIComponent(nextSlug)}`}
                className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:-translate-y-[1px] hover:border-zinc-400 active:translate-y-0 dark:border-zinc-800 dark:text-zinc-200"
              >
                SELANJUTNYA
              </Link>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            Stream tidak tersedia. Coba server lain.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-black shadow-xl dark:border-zinc-800 relative z-10">
          {currentStream?.url ? (
            <iframe
              title={episodeData?.title ?? "Stream"}
              src={currentStream.url}
              className="aspect-video w-full"
              allowFullScreen
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-black">
              {loading ? <AnimeLoader /> : (
                <div className="text-sm text-zinc-500">Stream tidak tersedia</div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-200">
            Pilih Server
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="typewriter">Pilih server yang paling lancar.</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {streamList.map((stream, index) => (
              <button
                key={`${stream.url}-${index}`}
                type="button"
                onClick={() => setCurrentStream(stream)}
                className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-[1px] active:translate-y-0 ${currentStream?.url === stream.url
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-300"
                  }`}
              >
                {stream.name ?? `Server ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
