import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * One connection pool per process, opened on first use so `next build` (which imports pages
 * without a database) does not need DATABASE_URL. Render sets it on the service; previews get
 * their own database, seeded from the scrubbed production snapshot.
 */
type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __db?: Db };

function connect(): Db {
  if (globalForDb.__db) return globalForDb.__db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { max: 5, prepare: false });
  globalForDb.__db = drizzle(client, { schema });
  return globalForDb.__db;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = connect() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});
export { schema };
