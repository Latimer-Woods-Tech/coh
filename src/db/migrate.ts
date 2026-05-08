import { Pool } from '@neondatabase/serverless';
import migration0000 from '../../drizzle/0000_confused_spencer_smythe.sql';
import migration0001 from '../../drizzle/0001_seed_membership_plans.sql';

const ALL_MIGRATIONS: Array<{ name: string; sql: string }> = [
  { name: '0000_confused_spencer_smythe', sql: migration0000 },
  { name: '0001_seed_membership_plans', sql: migration0001 },
];

/**
 * Idempotent schema bootstrap. Tracks applied migrations in
 * coh_migrations(name TEXT PRIMARY KEY, applied_at TIMESTAMP DEFAULT NOW()).
 * Splits each file on `--> statement-breakpoint` (Drizzle's separator) and
 * runs each statement individually so partial failures don't leave half-state.
 */
export async function runMigrations(hyperdrive: Hyperdrive): Promise<{ applied: string[]; skipped: string[] }> {
  const pool = new Pool({ connectionString: hyperdrive.connectionString });
  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coh_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    for (const m of ALL_MIGRATIONS) {
      const { rows } = await pool.query<{ name: string }>(
        'SELECT name FROM coh_migrations WHERE name = $1',
        [m.name],
      );

      if (rows.length > 0) {
        skipped.push(m.name);
        continue;
      }

      const statements = m.sql
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await pool.query(stmt);
      }

      await pool.query(
        'INSERT INTO coh_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [m.name],
      );
      applied.push(m.name);
    }
  } finally {
    await pool.end();
  }

  return { applied, skipped };
}
