/**
 * Sign up's one question of its own: whether an email is already on an
 * account, so the sign up page can say "sign in instead" before anything
 * is made. Signing up, verifying and signing in themselves are Better
 * Auth's endpoints, under /api/auth (../accounts.ts).
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';

export const accountRoutes = new OpenAPIHono();

const emailTaken = createRoute({
  method: 'post',
  path: '/account/email-taken',
  tags: ['Account'],
  summary: 'Whether an email is already on an account',
  description: 'For the sign up page, which then says to sign in instead.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ email: z.email('Check the email, it does not look right') }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Whether it is', content: { 'application/json': { schema: z.object({ taken: z.boolean() }) } } },
    400: { description: 'Not an email', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

accountRoutes.openapi(emailTaken, async (c) => {
  const email = c.req.valid('json').email.trim().toLowerCase();
  const [found] = await db.select({ id: t.authUsers.id }).from(t.authUsers).where(eq(t.authUsers.email, email));
  return c.json({ taken: Boolean(found) }, 200);
});
