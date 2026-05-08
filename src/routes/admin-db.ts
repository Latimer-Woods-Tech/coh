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
    // Prefer direct DATABASE_URL for migrations (bypasses Hyperdrive proxy);
    // fall back to Hyperdrive binding if DATABASE_URL isn't set.
    const connection = c.env.DATABASE_URL ?? c.env.HYPERDRIVE;
    const result = await runMigrations(connection);
    return c.json({ ok: true, bootstrapped: userCount === 0, ...result });
  } catch (error) {
    // ErrorEvent from neon-serverless wraps the underlying error in different ways depending on cause
    const e = error as Record<string, unknown>;
    return c.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
      // ErrorEvent fields
      message: typeof e?.message === 'string' ? e.message : undefined,
      type: typeof e?.type === 'string' ? e.type : undefined,
      reason: typeof e?.reason === 'string' ? e.reason : undefined,
      // Standard PG error fields
      code: typeof e?.code === 'string' ? e.code : undefined,
      detail: typeof e?.detail === 'string' ? e.detail : undefined,
      severity: typeof e?.severity === 'string' ? e.severity : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});

/**
 * Reset the schema by dropping the public schema and re-creating it.
 * Open while users.count = 0 (same gate as /migrate). Useful when the
 * existing schema has drifted from the current Drizzle definition.
 *
 * POST /__db/reset
 */
adminDb.post('/reset', async (c) => {
  const connection = c.env.DATABASE_URL ?? c.env.HYPERDRIVE.connectionString;
  const pool = new Pool({ connectionString: connection });
  try {
    // Refuse if there are any real users (data loss guard)
    try {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
      if ((rows[0]?.count ?? '0') !== '0') {
        return c.json({ error: 'Refusing to reset — users table has data' }, 403);
      }
    } catch {
      // No users table yet — proceed
    }

    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO neondb_owner');
    await pool.query('GRANT ALL ON SCHEMA public TO public');

    return c.json({ ok: true, reset: true });
  } catch (error) {
    return c.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  } finally {
    await pool.end();
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
