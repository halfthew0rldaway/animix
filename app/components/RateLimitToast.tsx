"use client";

import { useEffect, useRef, useState } from "react";
import type { RateLimitNotice } from "../libs/rateLimitClient";

type ToastState = {
  id: number;
  message: string;
  expiresAt: number;
};

const formatSeconds = (ms: number) => {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  return `${seconds}s`;
};

export default function RateLimitToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<RateLimitNotice>;
      const waitMs = customEvent.detail?.waitMs ?? 0;
      if (!waitMs) return;
      const seconds = formatSeconds(waitMs);
      const message = `Cooling down to respect rate limit. Please wait ~${seconds}.`;
      const duration = Math.max(waitMs, 4000);
      const expiresAt = Date.now() + duration;

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setToast({ id: Date.now(), message, expiresAt });
      timeoutRef.current = window.setTimeout(() => {
        setToast(null);
      }, duration);
    };

    window.addEventListener("animix-rate-limit", handler);
    return () => {
      window.removeEventListener("animix-rate-limit", handler);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 px-4 py-3 text-sm text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Rate Limit Guard
        </p>
        <p className="mt-1 text-sm">{toast.message}</p>
      </div>
    </div>
  );
}
