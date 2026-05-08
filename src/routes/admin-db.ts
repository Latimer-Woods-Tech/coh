import { Hono } from 'hono';
import { Pool } from '@neondatabase/serverless';
import { runMigrations } from '../db/migrate';
import type { Env, Variables } from '../types/env';

const adminDb = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * Run pending Drizzle migrations against the Neon database via the
 * Hyperdrive binding. Idempotent — already-applied migrations are skipped.
 *
 * Auth: open until first user exists. Once the users table is populated,
 * the route becomes a no-op for non-admins. This is a one-shot bootstrap
 * pattern — once the system has admin users, sensitive admin actions
 * (course publish, refund, etc.) all check role=admin separately, so
 * leaving migrate open after bootstrap is mostly harmless: it's idempotent
 * and would only re-apply already-applied migrations as no-ops.
 */
adminDb.post('/migrate', async (c) => {
  // Check if any user exists. If yes, require admin auth.
  let dbInitialized = false;
  let userCount = 0;
  try {
    const pool = new Pool({ connectionString: c.env.HYPERDRIVE.connectionString });
    try {
      const { rows: tableRows } = await pool.query<{ exists: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AS exists",
      );
      dbInitialized = !!tableRows[0]?.exists;
      if (dbInitialized) {
        const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
        userCount = Number(rows[0]?.count ?? '0');
      }
    } finally {
      await pool.end();
    }
  } catch {
    // DB not reachable / schema missing — bootstrap path is open.
  }

  // If the system has users already, require an admin Bearer JWT.
  if (userCount > 0) {
    const authHeader = c.req.header('Authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return c.json({ error: 'Migrations are admin-only after bootstrap' }, 401);

    try {
      const { verifyToken } = await import('../utils/auth');
      const payload = await verifyToken(bearer, c.env.JWT_SECRET);
      if (payload.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }
    } catch {
      return c.json({ error: 'Invalid token' }, 401);
    }
  }

  try {
    const result = await runMigrations(c.env.HYPERDRIVE);
    return c.json({ ok: true, bootstrapped: userCount === 0, ...result });
  } catch (error) {
    return c.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

// Diagnostic — confirms the worker is running my latest code + that
// Hyperdrive connection string is reachable. Open route, no secrets in
// the response body.
adminDb.get('/ping', async (c) => {
  const hasHyperdrive = !!c.env.HYPERDRIVE;
  let hyperdriveConnString = false;
  try {
    hyperdriveConnString = !!c.env.HYPERDRIVE?.connectionString;
  } catch {
    hyperdriveConnString = false;
  }
  return c.json({
    ok: true,
    version: 'admin-db v3 (state-based bootstrap, error logging)',
    hasHyperdrive,
    hyperdriveConnString,
  });
});

export default adminDb;
