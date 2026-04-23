type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __rateBuckets: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> =
  globalThis.__rateBuckets ?? new Map<string, Bucket>();
globalThis.__rateBuckets = buckets;

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number;
};

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetIn: bucket.resetAt - now };
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
