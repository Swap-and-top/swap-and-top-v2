/**
 * Applies the table changes not yet made (the files in apps/api/drizzle),
 * as `pnpm db:migrate` does. On our own server the site runs this as it
 * starts (apps/web/src/instrumentation.ts), because the staging and
 * production databases are private to the server: their tables change with
 * the code, when it is pushed to staging and when it goes live.
 *
 * The site runs as several copies, which all start at once on a deploy. So
 * each takes the same lock in the database first: one copy applies the
 * changes while the others wait, then find nothing left to do.
 *
 * Only where MIGRATIONS_DIR is set (the Dockerfile sets it). Localhost and
 * Vercel never run it: the development database is changed by hand, after
 * asking the owner.
 */

import '../loadEnv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { ssl, url } from './client';

/** Any fixed number: the lock's name in the database. */
const LOCK = 7_402_118;

export async function applyMigrations(): Promise<void> {
  const folder = process.env.MIGRATIONS_DIR;
  if (!folder) return;
  // One connection of its own, so the lock and the changes share it.
  const one = postgres(url, { ssl, prepare: false, max: 1 });
  try {
    await one`select pg_advisory_lock(${LOCK})`;
    await migrate(drizzle(one), { migrationsFolder: folder });
    console.info('Table changes are up to date.');
  } finally {
    // Closing the connection also lets go of the lock.
    await one.end();
  }
}
