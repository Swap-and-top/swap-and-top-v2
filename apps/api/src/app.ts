/**
 * The API: every route, under /api, with the OpenAPI contract at
 * /api/openapi.json and the Swagger page at /api/docs to read and try each
 * endpoint. The same address works on its own server and inside the web app.
 */

import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { accountRoutes } from './routes/account';
import { healthRoutes } from './routes/health';
import { listingRoutes } from './routes/listings';
import { meRoutes } from './routes/me';
import { storeRoutes } from './routes/stores';

export const app = new OpenAPIHono({
  // A request that fails its checks gets one plain message back.
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues.map((i) => i.message).join('. ') }, 400);
    }
  },
}).basePath('/api');

// The web app runs on another port while testing.
app.use('*', cors({ origin: ['http://localhost:3000'] }));

app.route('/', healthRoutes);
app.route('/', listingRoutes);
app.route('/', storeRoutes);
app.route('/', meRoutes);
app.route('/', accountRoutes);

// Endpoints for an account take the Supabase sign in token.
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

app.doc31('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Swap & Top API',
    version: '0.1.0',
    description:
      'The system of record for Swap & Top. Public endpoints need no sign in. Endpoints for an account take the Supabase sign in token as a Bearer token.',
  },
});

app.get('/docs', swaggerUI({ url: '/api/openapi.json' }));
app.get('/', (c) => c.redirect('/api/docs'));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Something went wrong' }, 500);
});
