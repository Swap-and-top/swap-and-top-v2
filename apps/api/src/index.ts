/** Runs the API as a server of its own, on port 4000 unless API_PORT says otherwise. */

import './loadEnv';
import { serve } from '@hono/node-server';
import { app } from './app';

const port = Number(process.env.API_PORT ?? 4000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API on http://localhost:${info.port}/api, docs at /api/docs`);
});
