import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

export function createDb(hyperdrive: Hyperdrive) {
  const pool = new Pool({ connectionString: hyperdrive.connectionString });
  return drizzle(pool, { schema });
}
