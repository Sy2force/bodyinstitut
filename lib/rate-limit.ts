/**
 * Tiny in-memory sliding-window rate limiter.
 * For production you'd swap with Redis/Upstash — but this is enough
 * to stop hammering a single Node process.
 */

interface Bucket {
  hits: number[];
}

const STORE = new Map<string, Bucket>();

interface Options {
  windowMs?: number; // default 60s
  max?: number;      // default 5
}

export function rateLimit(key: string, opts: Options = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 5;
  const now = Date.now();
  const cutoff = now - windowMs;

  const bucket = STORE.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);
  if (bucket.hits.length >= max) {
    STORE.set(key, bucket);
    const reset = Math.ceil((bucket.hits[0] + windowMs - now) / 1000);
    return { ok: false as const, reset };
  }
  bucket.hits.push(now);
  STORE.set(key, bucket);
  // light periodic cleanup
  if (STORE.size > 5000) {
    for (const [k, b] of STORE) {
      if (b.hits.length === 0 || b.hits[b.hits.length - 1] < cutoff) {
        STORE.delete(k);
      }
    }
  }
  return { ok: true as const, remaining: max - bucket.hits.length };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
