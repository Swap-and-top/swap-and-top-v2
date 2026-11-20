/**
 * One connection pool to the database, shared by every route.
 *
 * `prepare: false` lets it work through Supabase's transaction pooler, which
 * Vercel needs: each function call borrows a connection only for a moment.
 */

// The settings first, whichever file of the API is loaded first.
import '../loadEnv';
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

/**
 * Supabase is reached over the internet, so SSL is asked for. Our own
 * Postgres sits on the same server as the site and has none: its address
 * says so by ending in `?sslmode=disable`.
 */
export const url = process.env.DATABASE_URL ?? '';
export const ssl = /[?&]sslmode=disable\b/.test(url) ? false : 'require';

export const sql = (shared.sntSql ??= postgres(url, {
  ssl,
  prepare: false,
  // One each on Vercel, and while a production build makes pages in several
  // workers at once.
  max: process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build' ? 1 : 5,
  idle_timeout: 20,
}));
export const db = drizzle(sql, { schema, casing: 'snake_case' });
