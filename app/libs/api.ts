export function getApiBase(): string {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }
  return api.replace(/\/+$/, "");
}

export function buildApiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

type DevCacheEntry = {
  expiresAt: number;
  value: { ok: true; data: unknown } | { ok: false; error: string };
};

type DevCacheStore = Map<string, DevCacheEntry>;

const globalForCache = globalThis as typeof globalThis & {
  __devApiCache?: DevCacheStore;
  __apiRateLimit?: { timestamps: number[] };
};

const devCache: DevCacheStore = globalForCache.__devApiCache ?? new Map();
globalForCache.__devApiCache = devCache;

const DEV_CACHE_ENABLED =
  process.env.NODE_ENV === "development" &&
  process.env.DEV_API_CACHE !== "false";

const DEFAULT_TTL_MS =
  Number(process.env.DEV_API_CACHE_TTL_MS ?? "") || 1000 * 60 * 5;

const DEFAULT_ERROR_TTL_MS =
  Number(process.env.DEV_API_CACHE_ERROR_TTL_MS ?? "") || 1000 * 20;

const RATE_LIMIT_ENABLED = process.env.API_RATE_LIMIT_ENABLED !== "false";
const RATE_LIMIT_PER_MIN = Number(process.env.API_RATE_LIMIT_PER_MIN ?? "") || 70;
const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitState =
  globalForCache.__apiRateLimit ?? { timestamps: [] as number[] };
globalForCache.__apiRateLimit = rateLimitState;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRateLimit = (url: string) => {
  if (!RATE_LIMIT_ENABLED) return false;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!base) return false;
  return url.startsWith(base);
};

export const getRateLimitSnapshot = () => {
  const now = Date.now();
  rateLimitState.timestamps = rateLimitState.timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  const used = rateLimitState.timestamps.length;
  const oldest = used > 0 ? rateLimitState.timestamps[0] : null;
  const resetInMs = oldest ? Math.max(RATE_LIMIT_WINDOW_MS - (now - oldest), 0) : RATE_LIMIT_WINDOW_MS;
  const resetAt = now + resetInMs;
  return {
    enabled: RATE_LIMIT_ENABLED,
    used,
    limit: RATE_LIMIT_PER_MIN,
    windowMs: RATE_LIMIT_WINDOW_MS,
    resetAt,
    resetInMs,
  };
};

type RateLimitInfo = {
  waitMs: number;
  used: number;
  limit: number;
  windowMs: number;
};

const waitForRateLimitSlot = async (): Promise<RateLimitInfo> => {
  if (RATE_LIMIT_PER_MIN <= 0) {
    return {
      waitMs: 0,
      used: 0,
      limit: RATE_LIMIT_PER_MIN,
      windowMs: RATE_LIMIT_WINDOW_MS,
    };
  }
  let waitedMs = 0;
  while (true) {
    const now = Date.now();
    rateLimitState.timestamps = rateLimitState.timestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );
    if (rateLimitState.timestamps.length < RATE_LIMIT_PER_MIN) {
      rateLimitState.timestamps.push(now);
      return {
        waitMs: waitedMs,
        used: rateLimitState.timestamps.length,
        limit: RATE_LIMIT_PER_MIN,
        windowMs: RATE_LIMIT_WINDOW_MS,
      };
    }
    const oldest = rateLimitState.timestamps[0];
    const waitMs = Math.max(RATE_LIMIT_WINDOW_MS - (now - oldest) + 5, 50);
    await sleep(waitMs);
    waitedMs += waitMs;
  }
};

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

type FetchMeta = {
  rateLimitWaitMs?: number;
  rateLimitUsed?: number;
  rateLimitLimit?: number;
  rateLimitWindowMs?: number;
};

export async function safeFetchJson<T>(
  url: string,
  init?: NextFetchInit,
  options?: { cacheKey?: string; ttlMs?: number; errorTtlMs?: number }
): Promise<
  | { ok: true; data: T; meta?: FetchMeta }
  | { ok: false; error: string; meta?: FetchMeta }
> {
  const method = init?.method ?? "GET";
  const cacheKey = options?.cacheKey ?? `${method}:${url}`;
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const errorTtlMs = options?.errorTtlMs ?? DEFAULT_ERROR_TTL_MS;

  if (DEV_CACHE_ENABLED) {
    const cached = devCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as { ok: true; data: T } | { ok: false; error: string };
    }
  }

  let meta: FetchMeta | undefined;
  try {
    if (shouldRateLimit(url)) {
      const info = await waitForRateLimitSlot();
      meta = {
        rateLimitWaitMs: info.waitMs || undefined,
        rateLimitUsed: info.used,
        rateLimitLimit: info.limit,
        rateLimitWindowMs: info.windowMs,
      };
    }
    const res = await fetch(url, init);
    if (!res.ok) {
      const storedPayload = {
        ok: false,
        error: `Request failed with ${res.status}`,
      } as const;
      const payload = meta ? { ...storedPayload, meta } : storedPayload;
      if (DEV_CACHE_ENABLED) {
        devCache.set(cacheKey, {
          value: storedPayload,
          expiresAt: Date.now() + errorTtlMs,
        });
      }
      return payload;
    }
    const data = (await res.json()) as T;
    const storedPayload = { ok: true, data } as const;
    const payload = meta ? { ...storedPayload, meta } : storedPayload;
    if (DEV_CACHE_ENABLED) {
      devCache.set(cacheKey, {
        value: storedPayload,
        expiresAt: Date.now() + ttlMs,
      });
    }
    return payload;
  } catch (error) {
    const storedPayload = {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    } as const;
    const payload = meta ? { ...storedPayload, meta } : storedPayload;
    if (DEV_CACHE_ENABLED) {
      devCache.set(cacheKey, {
        value: storedPayload,
        expiresAt: Date.now() + errorTtlMs,
      });
    }
    return payload;
  }
}
