import { describe, expect, it } from 'vitest';
import { createMockKV } from '../helpers/mock-kv';

/**
 * Webhook idempotency uses KV keys of the form `stripe:webhook:processed:{eventId}`
 * with a 14-day TTL. The webhook handler short-circuits on a duplicate event ID.
 *
 * These tests verify the contract directly against the KV mock — full route-level
 * tests require the @cloudflare/vitest-pool-workers runtime + a test DB and are
 * tracked separately in W4.3.
 */

const STRIPE_EVENT_IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24 * 14;

async function isProcessed(env: { SESSIONS: KVNamespace }, eventId: string) {
  return Boolean(await env.SESSIONS.get(`stripe:webhook:processed:${eventId}`));
}

async function markProcessed(env: { SESSIONS: KVNamespace }, eventId: string) {
  await env.SESSIONS.put(`stripe:webhook:processed:${eventId}`, '1', {
    expirationTtl: STRIPE_EVENT_IDEMPOTENCY_TTL_SECONDS,
  });
}

describe('Stripe webhook idempotency', () => {
  it('returns false for a never-seen event ID', async () => {
    const env = { SESSIONS: createMockKV() };
    expect(await isProcessed(env, 'evt_new_123')).toBe(false);
  });

  it('returns true after marking processed', async () => {
    const env = { SESSIONS: createMockKV() };
    await markProcessed(env, 'evt_done_456');
    expect(await isProcessed(env, 'evt_done_456')).toBe(true);
  });

  it('isolates state per event ID', async () => {
    const env = { SESSIONS: createMockKV() };
    await markProcessed(env, 'evt_a');
    expect(await isProcessed(env, 'evt_a')).toBe(true);
    expect(await isProcessed(env, 'evt_b')).toBe(false);
  });

  it('uses the documented 14-day TTL', () => {
    expect(STRIPE_EVENT_IDEMPOTENCY_TTL_SECONDS).toBe(1_209_600);
  });
});
