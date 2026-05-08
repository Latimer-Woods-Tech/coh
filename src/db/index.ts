import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

/**
 * Build a Drizzle DB client. Accepts either:
 *   - A Hyperdrive binding (preferred when its WebSocket proxy is healthy)
 *   - A plain postgres connection string (used by the migration runner +
 *     fallback when Hyperdrive's WS handshake is failing).
 */
export function createDb(connection: Hyperdrive | string) {
  const connectionString = typeof connection === 'string' ? connection : connection.connectionString;
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}
