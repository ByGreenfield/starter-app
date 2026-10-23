// Applies drizzle/ migrations. Runs as Render's pre-deploy command (before the new version takes
// traffic) and locally with `pnpm db:migrate`.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}
const sql = postgres(url, { max: 1, prepare: false });
try {
  await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
  console.log('migrations applied');
} finally {
  await sql.end();
}
