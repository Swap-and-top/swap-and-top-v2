/**
 * One connection pool to the database, shared by every route.
 *
 * `prepare: false` lets it work through Supabase's transaction pooler, which
 * Vercel needs: each function call borrows a connection only for a moment.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is missing. Add it to .env, or to the Vercel project.');
}

/**
 * Kept on `globalThis` so the web app's dev server, which reloads this file
 * on every change, reuses the pool rather than opening five more connections
 * each time; Supabase's session pooler allows only 15. Idle connections close
 * after 20 seconds.
 */
const shared = globalThis as { sntSql?: ReturnType<typeof postgres> };

export const sql = (shared.sntSql ??= postgres(process.env.DATABASE_URL ?? '', {
  ssl: 'require',
  prepare: false,
  max: process.env.VERCEL ? 1 : 5,
  idle_timeout: 20,
}));
export const db = drizzle(sql, { schema, casing: 'snake_case' });
