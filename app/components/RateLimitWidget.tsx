"use client";

import { useEffect, useMemo, useState } from "react";
import type { RateLimitNotice } from "../libs/rateLimitClient";

type RateState = {
  used: number;
  limit: number;
  windowMs: number;
  waitMs?: number;
  resetAt?: number;
};

const STORAGE_KEY = "animix-rate-limit-widget";
const HIDDEN_KEY = "animix-rate-limit-hidden";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);

const formatSeconds = (ms: number) =>
  `${Math.max(1, Math.ceil(ms / 1000))}s`;

export default function RateLimitWidget() {
  const [hidden, setHidden] = useState(false);
  const [state, setState] = useState<RateState>({
    used: 0,
    limit: 70,
    windowMs: 60_000,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedHidden = window.localStorage.getItem(HIDDEN_KEY);
    if (storedHidden === "true") {
      setHidden(true);
    }
    const storedState = window.localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState) as RateState;
        if (typeof parsed.used === "number" && typeof parsed.limit === "number") {
          setState(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<RateLimitNotice>).detail;
      if (!detail) return;
      setState((prev) => {
        const next = {
          used: typeof detail.used === "number" ? detail.used : prev.used,
          limit: typeof detail.limit === "number" ? detail.limit : prev.limit,
          windowMs:
            typeof detail.windowMs === "number" ? detail.windowMs : prev.windowMs,
          waitMs: detail.waitMs ?? prev.waitMs,
          resetAt: detail.windowMs
            ? Date.now() + detail.windowMs
            : prev.resetAt,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener("animix-rate-limit", handler);
    return () => window.removeEventListener("animix-rate-limit", handler);
  }, []);

  const percent = useMemo(() => {
    if (!state.limit) return 0;
    return clamp(Math.round((state.used / state.limit) * 100));
  }, [state.limit, state.used]);

  const isHot = percent >= 80;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = state.resetAt ? Math.max(state.resetAt - now, 0) : null;
  const resetText = remainingMs !== null ? `Resets in ${formatSeconds(remainingMs)}` : null;
  const waitText = state.waitMs ? `Cooldown ${formatSeconds(state.waitMs)}` : null;

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/rate-limit");
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setState((prev) => {
          const next = {
            used: typeof data.used === "number" ? data.used : prev.used,
            limit: typeof data.limit === "number" ? data.limit : prev.limit,
            windowMs: typeof data.windowMs === "number" ? data.windowMs : prev.windowMs,
            waitMs: prev.waitMs,
            resetAt: typeof data.resetAt === "number" ? data.resetAt : prev.resetAt,
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } catch {
        // ignore
      }
    };

    poll();
    const id = window.setInterval(poll, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const toggleHidden = () => {
    const next = !hidden;
    setHidden(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HIDDEN_KEY, String(next));
    }
  };

  if (hidden) {
    return (
      <button
        type="button"
        onClick={toggleHidden}
        className="fixed bottom-20 right-5 md:bottom-5 z-50 rounded-full border border-white/10 bg-zinc-950/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur"
      >
        Rate
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-5 md:bottom-5 z-50 flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/85 px-3 py-2 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full ${isHot ? "animate-pulse" : ""
          }`}
        style={{
          background: `conic-gradient(${isHot ? "#ff2d6f" : "#f0d98c"
            } ${percent}%, rgba(255,255,255,0.12) 0)`,
        }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-semibold">
          {percent}%
        </div>
      </div>
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="uppercase tracking-[0.2em] text-zinc-400">
          Rate Limit
        </span>
        <span className="text-zinc-100">
          {state.used}/{state.limit} in {Math.round(state.windowMs / 1000)}s
        </span>
        {resetText ? (
          <span className="text-[10px] text-zinc-300">{resetText}</span>
        ) : null}
        {waitText ? (
          <span className="text-[10px] text-rose-200">{waitText}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={toggleHidden}
        className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40"
      >
        Hide
      </button>
    </div>
  );
}
