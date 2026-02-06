"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const HISTORY_KEY = "juju-otaku-history";

type HistoryItem = {
  id: string;
  animeId?: string | null;
  episodeId: string;
  title: string;
  image?: string | null;
  createdAt?: string;
  watchedAt?: string;
};

type HistoryListProps = {
  title?: string;
  limit?: number;
};

export default function HistoryList({
  title = "Continue Watching",
  limit = 8,
}: HistoryListProps) {
  const { data: session } = useSession();
  const useDatabase = process.env.NEXT_PUBLIC_USE_DATABASE === "true";

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocal = () => {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
      setItems(Array.isArray(parsed) ? parsed.slice(0, limit) : []);
    };

    if (!useDatabase || !session?.user) {
      loadLocal();
      setLoading(false);
      return;
    }

    const loadRemote = async () => {
      try {
        const res = await fetch("/api/history");
        if (!res.ok) {
          loadLocal();
          return;
        }
        const json = (await res.json()) as { history?: HistoryItem[] };
        setItems((json.history ?? []).slice(0, limit));
      } catch {
        loadLocal();
      } finally {
        setLoading(false);
      }
    };

    loadRemote();
  }, [useDatabase, session?.user, limit]);

  const hasItems = items.length > 0;
  const cards = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        href: `/watch/${encodeURIComponent(item.episodeId)}?slug=${encodeURIComponent(
          item.animeId ?? ""
        )}&title=${encodeURIComponent(item.title)}&image=${encodeURIComponent(
          item.image ?? ""
        )}`,
      })),
    [items]
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-100">
          {title}
        </h2>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="px-6 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
              Fetching history
            </p>
          </div>
          <div className="border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="py-6">
              <div className="loading-wrap">
                <div className="loading-mascot">
                  <span className="loading-mouth" />
                </div>
                <div className="loading-bar" />
                <p className="loading-text">Loading history...</p>
              </div>
            </div>
          </div>
        </div>
      ) : hasItems ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="grid auto-cols-[220px] grid-flow-col gap-4">
            {cards.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="relative aspect-[2/3] bg-zinc-100 dark:bg-zinc-900">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No history yet.
        </div>
      )}
    </section>
  );
}
