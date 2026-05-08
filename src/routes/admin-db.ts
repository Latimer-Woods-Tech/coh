import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../utils/auth';
import { runMigrations } from '../db/migrate';
import type { Env, Variables } from '../types/env';

const adminDb = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Run any pending Drizzle migrations against the Neon database via the
 * Hyperdrive binding. Idempotent — already-applied migrations are skipped
 * (tracked in coh_migrations table).
 *
 * POST /api/admin/db/migrate
 *
 * Auth (either):
 *   1. Standard admin JWT (preferred), OR
 *   2. Bootstrap header `X-Bootstrap-Token: $JWT_SECRET` — only honored
 *      when the users table is empty / does not yet exist (chicken-and-egg
 *      for first-run schema creation).
 */
adminDb.post('/migrate', async (c) => {
  const bootstrapToken = c.req.header('X-Bootstrap-Token');
  const jwtSecret = c.env.JWT_SECRET;

  let authorized = false;
  let bootstrapped = false;

  if (bootstrapToken && jwtSecret && bootstrapToken === jwtSecret) {
    // Bootstrap path: only valid while DB has zero users (or no users table at all)
    try {
      const { Pool } = await import('@neondatabase/serverless');
      const pool = new Pool({ connectionString: c.env.HYPERDRIVE.connectionString });
      let usersExist = false;
      try {
        const { rows: tableRows } = await pool.query<{ exists: boolean }>(
          "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AS exists",
        );
        if (tableRows[0]?.exists) {
          const { rows: userRows } = await pool.query<{ count: string }>(
            'SELECT COUNT(*)::text AS count FROM users',
          );
          usersExist = (userRows[0]?.count ?? '0') !== '0';
        }
      } finally {
        await pool.end();
      }

      if (usersExist) {
        return c.json({ error: 'Bootstrap token no longer valid; use admin auth' }, 403);
      }

      authorized = true;
      bootstrapped = true;
    } catch {
      // DB not reachable yet; bootstrap is allowed since this is the first run
      authorized = true;
      bootstrapped = true;
    }
  } else {
    // Standard admin path
    const cookieToken = getCookie(c, 'authToken');
    const authHeader = c.req.header('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken ?? bearerToken;

    if (!token) {
      return c.json({ error: 'Missing authorization token' }, 401);
    }
    try {
      const payload = await verifyToken(token, c.env.JWT_SECRET);
      if (payload.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }
      authorized = true;
    } catch {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  }

  if (!authorized) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const result = await runMigrations(c.env.HYPERDRIVE);
  return c.json({ ok: true, bootstrapped, ...result });
});

export default adminDb;
