import { Hono } from 'hono';
import { runMigrations } from '../db/migrate';
import { authMiddleware, adminOnly } from '../middleware/auth';
import type { Env, Variables } from '../types/env';

const adminDb = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require admin
adminDb.use('*', authMiddleware);
adminDb.use('*', adminOnly);

/**
 * Run any pending Drizzle migrations against the Neon database via the
 * Hyperdrive binding. Idempotent — already-applied migrations are skipped
 * (tracked in coh_migrations table).
 *
 * POST /api/admin/db/migrate
 */
adminDb.post('/migrate', async (c) => {
  const result = await runMigrations(c.env.HYPERDRIVE);
  return c.json({ ok: true, ...result });
});

export default adminDb;
