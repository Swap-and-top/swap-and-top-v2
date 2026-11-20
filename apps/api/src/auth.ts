/**
 * Sign in, on the API's side. Better Auth (accounts.ts) signs a person in,
 * by email and password or by phone and a one time code, and gives the
 * browser a session cookie its scripts cannot read. The browser sends it
 * with every request to the API; this reads who it is for.
 *
 * Scripts and tests may send the session's token instead, as
 * `Authorization: Bearer <token>` (the `token` a sign in answers with;
 * Better Auth's bearer plugin reads it).
 */

import { createMiddleware } from 'hono/factory';
import { auth, isStandInEmail } from './accounts';

export interface AuthUser {
  /** The account's id (auth_users.id). */
  id: string;
  /** The verified phone, in international form: +263771234567. */
  phone: string | null;
  email: string | null;
  /** Whether that email has been verified (a code sent to it). */
  emailVerified: boolean;
  /** The name given at sign up, if they signed up by email. */
  name: string | null;
  /** Their neighbourhood and town from sign up: "Mbare, Harare". */
  location: string | null;
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/** Who each request is from, read once however many checks ask. */
const asked = new WeakMap<Request, Promise<AuthUser | null>>();

/** Who this request is signed in as, or null. */
export function verify(request: Request): Promise<AuthUser | null> {
  let user = asked.get(request);
  if (!user) {
    user = read(request.headers).catch(() => null);
    asked.set(request, user);
  }
  return user;
}

async function read(headers: Headers): Promise<AuthUser | null> {
  if (!headers.get('Cookie') && !headers.get('Authorization')) return null;
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const user = session.user;
  return {
    id: user.id,
    phone: user.phoneNumberVerified ? text(user.phoneNumber) : null,
    email: isStandInEmail(user.email) ? null : user.email,
    emailVerified: !isStandInEmail(user.email) && Boolean(user.emailVerified),
    name: text(user.name),
    location: text(user.location),
  };
}

/** Notes who is signed in, when a valid sign in comes; lets everyone through. */
export const optionalAuth = createMiddleware<{ Variables: { authUser?: AuthUser } }>(
  async (c, next) => {
    const user = await verify(c.req.raw);
    if (user) c.set('authUser', user);
    await next();
  },
);

/** Lets a request through only with a valid sign in. */
export const requireAuth = createMiddleware<{ Variables: { authUser: AuthUser } }>(
  async (c, next) => {
    const user = await verify(c.req.raw);
    if (!user) return c.json({ error: 'Sign in needed' }, 401);
    c.set('authUser', user);
    await next();
  },
);
