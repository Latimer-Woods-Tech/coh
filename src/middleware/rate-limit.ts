import { Context, Next } from 'hono';
import type { Env, Variables } from '../types/env';

type RateLimitOptions = {
  namespace: string;
  maxRequests: number;
  windowSeconds: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

function getClientIp(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const clientId = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
  return clientId;
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;
    const ip = getClientIp(c);
    const key = `ratelimit:${options.namespace}:${ip}`;

    const raw = await c.env.SESSIONS.get(key);
    let state: RateLimitState;

    if (!raw) {
      state = {
        count: 1,
        resetAt: now + windowMs,
      };
    } else {
      const parsed = JSON.parse(raw) as RateLimitState;
      if (parsed.resetAt <= now) {
        state = {
          count: 1,
          resetAt: now + windowMs,
        };
      } else {
        state = {
          count: parsed.count + 1,
          resetAt: parsed.resetAt,
        };
      }
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));

    await c.env.SESSIONS.put(key, JSON.stringify(state), {
      expirationTtl: options.windowSeconds + 10,
    });

    c.header('X-RateLimit-Limit', String(options.maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, options.maxRequests - state.count)));
    c.header('X-RateLimit-Reset', String(Math.floor(state.resetAt / 1000)));

    if (state.count > options.maxRequests) {
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json({ error: 'Too many requests' }, 429);
    }

    await next();
  };
}
