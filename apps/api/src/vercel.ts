/**
 * The API as Next.js route handlers, so the web app can serve it at /api on
 * Vercel with no server of its own. apps/web/src/app/api/[[...route]] uses
 * these. The same app also runs on its own (src/index.ts).
 */

import './loadEnv';
import { handle } from 'hono/vercel';
import { app } from './app';

const handler = handle(app);
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
