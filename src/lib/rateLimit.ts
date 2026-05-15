import { NextRequest } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

const globalRateLimitStore = globalThis as typeof globalThis & {
  __portfolioRateLimitStore?: RateLimitStore;
};

const store = globalRateLimitStore.__portfolioRateLimitStore
  ?? new Map<string, RateLimitEntry>();

globalRateLimitStore.__portfolioRateLimitStore = store;

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  return forwardedFor
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || 'unknown';
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  current.count += 1;

  if (current.count > limit) {
    return {
      limited: true,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  return { limited: false, retryAfter: 0 };
}
