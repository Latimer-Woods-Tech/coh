import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createRateLimitMiddleware } from '../../src/middleware/rate-limit';
import { createMockKV } from '../helpers/mock-kv';
import type { Env, Variables } from '../../src/types/env';

function makeApp(maxRequests: number, windowSeconds: number) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.use('*', createRateLimitMiddleware({ namespace: 'test', maxRequests, windowSeconds }));
  app.get('/', (c) => c.json({ ok: true }));
  return app;
}

const baseEnv = (): Partial<Env> => ({
  SESSIONS: createMockKV(),
});

describe('createRateLimitMiddleware', () => {
  it('allows requests under the limit', async () => {
    const app = makeApp(3, 60);
    const env = baseEnv();
    const headers = { 'CF-Connecting-IP': '1.2.3.4' };

    for (let i = 0; i < 3; i += 1) {
      const res = await app.request('/', { headers }, env as Env);
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 once the limit is exceeded', async () => {
    const app = makeApp(2, 60);
    const env = baseEnv();
    const headers = { 'CF-Connecting-IP': '5.6.7.8' };

    await app.request('/', { headers }, env as Env);
    await app.request('/', { headers }, env as Env);
    const blocked = await app.request('/', { headers }, env as Env);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });

  it('isolates limits per IP', async () => {
    const app = makeApp(1, 60);
    const env = baseEnv();

    const a1 = await app.request('/', { headers: { 'CF-Connecting-IP': '10.0.0.1' } }, env as Env);
    const b1 = await app.request('/', { headers: { 'CF-Connecting-IP': '10.0.0.2' } }, env as Env);
    expect(a1.status).toBe(200);
    expect(b1.status).toBe(200);

    const a2 = await app.request('/', { headers: { 'CF-Connecting-IP': '10.0.0.1' } }, env as Env);
    expect(a2.status).toBe(429);
  });

  it('exposes rate-limit headers on every response', async () => {
    const app = makeApp(5, 60);
    const env = baseEnv();
    const res = await app.request('/', { headers: { 'CF-Connecting-IP': '9.9.9.9' } }, env as Env);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('4');
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('prefers cf-connecting-ip over x-forwarded-for (cf-connecting-ip is unspoofable)', async () => {
    const app = makeApp(1, 60);
    const env = baseEnv();

    // Two requests with different x-forwarded-for but the SAME cf-connecting-ip
    // should be counted as the same IP and the second should be rate-limited.
    await app.request('/', {
      headers: { 'CF-Connecting-IP': '1.1.1.1', 'x-forwarded-for': 'A' },
    }, env as Env);
    const second = await app.request('/', {
      headers: { 'CF-Connecting-IP': '1.1.1.1', 'x-forwarded-for': 'B' },
    }, env as Env);
    expect(second.status).toBe(429);
  });
});
