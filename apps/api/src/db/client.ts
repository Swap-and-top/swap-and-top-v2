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

export const sql = postgres(process.env.DATABASE_URL ?? '', {
  ssl: 'require',
  prepare: false,
  max: process.env.VERCEL ? 1 : 5,
});
export const db = drizzle(sql, { schema, casing: 'snake_case' });
