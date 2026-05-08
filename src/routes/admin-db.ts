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

/**
 * Bootstrap Stripe products + prices for VIP and Inner Circle on whatever
 * Stripe account `STRIPE_SECRET_KEY` belongs to, then patch `membership_plans`
 * rows so the seeded data references the live IDs.
 *
 * Idempotent: looks up by name first; only creates if missing. Same
 * users-empty guard as /migrate so it can't be called after launch.
 *
 * POST /__db/stripe-bootstrap
 */
adminDb.post('/stripe-bootstrap', async (c) => {
  const connection = c.env.DATABASE_URL ?? c.env.HYPERDRIVE.connectionString;
  const pool = new Pool({ connectionString: connection });

  try {
    // Lock guard — refuse after first user
    try {
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
      if ((rows[0]?.count ?? '0') !== '0') {
        return c.json({ error: 'Refusing to re-bootstrap — users already exist' }, 403);
      }
    } catch {}

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

    const tiers = [
      {
        tier: 'vip' as const,
        name: 'CypherOfHealing VIP',
        description: 'Early access to The Chair, member-only episodes, 10% off The Vault, monthly community circle.',
        monthlyAmount: 1900,
        annualAmount: 19000,
      },
      {
        tier: 'inner_circle' as const,
        name: 'CypherOfHealing Inner Circle',
        description: 'Everything in VIP plus quarterly 1:1 with the founder, full Academy access, Stage replays, private text channel.',
        monthlyAmount: 4900,
        annualAmount: 49000,
      },
    ];

    const results: Array<{ tier: string; productId: string; monthlyPriceId: string; annualPriceId: string }> = [];

    for (const t of tiers) {
      // Find-or-create product (search by exact name)
      const existing = await stripe.products.search({ query: `name:'${t.name}' AND active:'true'` });
      const product = existing.data[0] ?? await stripe.products.create({
        name: t.name,
        description: t.description,
      });

      // Find-or-create monthly + annual prices
      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
      let monthlyPrice = prices.data.find((p) => p.recurring?.interval === 'month' && p.unit_amount === t.monthlyAmount);
      let annualPrice = prices.data.find((p) => p.recurring?.interval === 'year' && p.unit_amount === t.annualAmount);

      if (!monthlyPrice) {
        monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: t.monthlyAmount,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
      }
      if (!annualPrice) {
        annualPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: t.annualAmount,
          currency: 'usd',
          recurring: { interval: 'year' },
        });
      }

      // Update membership_plans row
      await pool.query(
        `UPDATE membership_plans
         SET stripe_product_id = $1,
             stripe_price_id_monthly = $2,
             stripe_price_id_annual = $3
         WHERE tier = $4`,
        [product.id, monthlyPrice.id, annualPrice.id, t.tier],
      );

      results.push({
        tier: t.tier,
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        annualPriceId: annualPrice.id,
      });
    }

    // Find-or-create webhook endpoint pointing at our /api/webhooks/stripe
    const webhookUrl = 'https://api.cypherofhealing.com/api/webhooks/stripe';
    const events: string[] = [
      'checkout.session.completed',
      'charge.refunded',
      'payment_intent.payment_failed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ];

    const allWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = allWebhooks.data.find((w) => w.url === webhookUrl);

    let webhookSecret: string | null = null;
    let webhookId: string;

    if (existingWebhook) {
      // Already exists — secret can't be retrieved after creation; report only
      webhookId = existingWebhook.id;
      // Make sure events list is current
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await stripe.webhookEndpoints.update(existingWebhook.id, { enabled_events: events as any });
    } else {
      const created = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enabled_events: events as any,
        description: 'CypherOfHealing API — production',
      });
      webhookId = created.id;
      webhookSecret = created.secret ?? null;
    }

    return c.json({
      ok: true,
      bootstrapped: results,
      webhook: { id: webhookId, secretReturned: !!webhookSecret, secret: webhookSecret },
    });
  } catch (error) {
    return c.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
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
