/**
 * The API (apps/api), served by this app at /api, so one Vercel deploy holds
 * both the site and the API. Swagger is at /api/docs.
 */

export { DELETE, GET, OPTIONS, PATCH, POST, PUT } from '@snt/api/vercel';

// Every request reaches the database; nothing here is built ahead of time.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// On Vercel, run in Dublin, next to the database (Supabase, Ireland): each
// trip to it is then a few milliseconds instead of a crossing of the Atlantic.
export const preferredRegion = 'dub1';
