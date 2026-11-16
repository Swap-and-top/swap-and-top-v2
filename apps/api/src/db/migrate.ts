/**
 * Applies the table changes not yet made (the files in apps/api/drizzle),
 * as `pnpm db:migrate` does. On our own server the site runs this as it
 * starts (apps/web/src/instrumentation.ts), because the staging and
 * production databases are private to the server: their tables change with
 * the code, when it is pushed to staging and when it goes live.
 *
 * Only where MIGRATIONS_DIR is set (the Dockerfile sets it). Localhost and
 * Vercel never run it: the development database is changed by hand, after
 * asking the owner.
 */

import '../loadEnv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client';

export async function applyMigrations(): Promise<void> {
  const folder = process.env.MIGRATIONS_DIR;
  if (!folder) return;
  await migrate(db, { migrationsFolder: folder });
  console.info('Table changes are up to date.');
}
