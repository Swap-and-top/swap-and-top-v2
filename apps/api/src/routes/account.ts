/**
 * Making an account by email, and verifying its email, while email is not
 * set up: the account is made without sending anything, and the email is
 * verified with the mock code (MOCK_CODE in supabaseAdmin.ts). Once real
 * email is set up, sign up goes back to Supabase's own, which sends the code.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { sql } from '../db/client';
import { ErrorSchema } from '../schemas';
import { MOCK_CODE, supabaseAdmin } from '../supabaseAdmin';

export const accountRoutes = new OpenAPIHono();

const Ok = z.object({ ok: z.boolean() }).openapi('Ok');

const signUp = createRoute({
  method: 'post',
  path: '/auth/signup',
  tags: ['Account'],
  summary: 'Make an account by email',
  description:
    'Makes the account with its email not yet verified, and sends nothing. Verify it with POST /auth/verify-email.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            firstName: z.string().trim().min(1, 'Enter your first name').max(50),
            surname: z.string().trim().min(1, 'Enter your surname').max(50),
            email: z.email('Check the email, it does not look right'),
            password: z.string().min(8, 'Choose a longer password, at least 8 characters'),
            location: z.string().trim().max(100).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: 'Made', content: { 'application/json': { schema: Ok } } },
    400: { description: 'Something is missing', content: { 'application/json': { schema: ErrorSchema } } },
    409: { description: 'The email is on an account', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

accountRoutes.openapi(signUp, async (c) => {
  const { firstName, surname, email, password, location } = c.req.valid('json');
  const made = await supabaseAdmin('/users', 'POST', {
    email,
    password,
    email_confirm: false,
    user_metadata: { name: `${firstName} ${surname}`, location },
  });
  if (made.code === 'email_exists' || made.status === 422) {
    return c.json({ error: 'That email is already on an account. Sign in instead.' }, 409);
  }
  if (!made.ok) throw new Error(`Sign up failed: ${made.status} ${made.code ?? ''}`);
  return c.json({ ok: true }, 201);
});

const verifyEmail = createRoute({
  method: 'post',
  path: '/auth/verify-email',
  tags: ['Account'],
  summary: 'Verify an email with its code',
  description: `While email is not set up the code is always ${MOCK_CODE}.`,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.email('Check the email, it does not look right'),
            code: z.string().trim(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Verified', content: { 'application/json': { schema: Ok } } },
    400: { description: 'Wrong code', content: { 'application/json': { schema: ErrorSchema } } },
    404: { description: 'No such account', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

accountRoutes.openapi(verifyEmail, async (c) => {
  const { email, code } = c.req.valid('json');
  if (code !== MOCK_CODE) return c.json({ error: 'That code is not right.' }, 400);
  const [user] = await sql<{ id: string }[]>`
    select id from auth.users where lower(email) = lower(${email}) limit 1`;
  if (!user) return c.json({ error: 'There is no account with that email.' }, 404);
  const done = await supabaseAdmin(`/users/${user.id}`, 'PUT', { email_confirm: true });
  if (!done.ok) throw new Error(`Verifying the email failed: ${done.status}`);
  return c.json({ ok: true }, 200);
});
