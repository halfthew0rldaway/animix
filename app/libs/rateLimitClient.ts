export type RateLimitNotice = {
  waitMs?: number;
  used?: number;
  limit?: number;
  windowMs?: number;
  source?: string;
};

const emitRateLimit = (detail: RateLimitNotice) => {
  if (typeof window === "undefined") return;
  if (
    detail.waitMs === undefined &&
    detail.used === undefined &&
    detail.limit === undefined
  ) {
    return;
  }
  window.dispatchEvent(new CustomEvent("animix-rate-limit", { detail }));
};

export const notifyRateLimit = (waitMs: number, source?: string) => {
  if (!Number.isFinite(waitMs) || waitMs <= 0) return;
  emitRateLimit({ waitMs, source });
};

export const updateRateLimitUsage = (
  used: number,
  limit: number,
  source?: string,
  windowMs?: number
) => {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return;
  emitRateLimit({ used, limit, source, windowMs });
};
