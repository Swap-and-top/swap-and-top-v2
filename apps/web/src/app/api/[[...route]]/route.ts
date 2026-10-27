/**
 * The API (apps/api), served by this app at /api, so one Vercel deploy holds
 * both the site and the API. Swagger is at /api/docs.
 */

export { DELETE, GET, OPTIONS, PATCH, POST, PUT } from '@snt/api/vercel';

// Every request reaches the database; nothing here is built ahead of time.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
