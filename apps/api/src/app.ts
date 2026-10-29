/**
 * The API: every route, under /api, with the OpenAPI contract at
 * /api/openapi.json and the Swagger page at /api/docs to read and try each
 * endpoint. The same address works on its own server and inside the web app.
 */

import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { verify } from './auth';
import { accountRoutes } from './routes/account';
import { dealRoutes } from './routes/deals';
import { healthRoutes } from './routes/health';
import { listingRoutes } from './routes/listings';
import { meRoutes, personFor } from './routes/me';
import { notificationRoutes } from './routes/notifications';
import { leadRoutes } from './routes/leads';
import { revealRoutes } from './routes/reveals';
import { statsRoutes } from './routes/stats';
import { activityRoutes } from './routes/activity';
import { appealRoutes } from './routes/appeals';
import { userRoutes } from './routes/users';
import { reportRoutes } from './routes/reports';
import { teamRoutes } from './routes/team';
import { verificationRoutes } from './routes/verification';
import { boostRoutes } from './routes/boosts';
import { offerRoutes } from './routes/offers';
import { postRoutes } from './routes/post';
import { savedRoutes } from './routes/saved';
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

// A banned account can do nothing but see who they are and see and appeal
// the ban (the web app shows them only that page).
const BANNED_MAY = [/^\/api\/me$/, /^\/api\/me\/actions\/[^/]+(\/appeal)?$/];
app.use('*', async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const user = header.startsWith('Bearer ') ? await verify(header.slice(7)) : null;
  if (user && !BANNED_MAY.some((path) => path.test(c.req.path))) {
    const person = await personFor(user);
    if (person.standing === 'banned') return c.json({ error: 'Your account is banned.', code: 'banned' }, 403);
  }
  await next();
});

app.route('/', healthRoutes);
app.route('/', listingRoutes);
app.route('/', storeRoutes);
app.route('/', meRoutes);
app.route('/', accountRoutes);
app.route('/', postRoutes);
app.route('/', offerRoutes);
app.route('/', leadRoutes);
app.route('/', revealRoutes);
app.route('/', statsRoutes);
app.route('/', boostRoutes);
app.route('/', dealRoutes);
app.route('/', savedRoutes);
app.route('/', notificationRoutes);
app.route('/', verificationRoutes);
app.route('/', teamRoutes);
app.route('/', reportRoutes);
app.route('/', userRoutes);
app.route('/', appealRoutes);
app.route('/', activityRoutes);

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
