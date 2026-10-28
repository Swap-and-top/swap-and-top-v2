/**
 * Sign in, on the API's side. Supabase Auth signs a person in, by email and
 * password or by phone and a one time code, and hands the browser a token.
 * Each request that needs an account sends it as
 * `Authorization: Bearer <token>`; this checks it against
 * Supabase's public keys (SUPABASE_JWKS_URL), so the API never needs the
 * Supabase secret to know who is asking.
 */

import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface AuthUser {
  /** The Supabase Auth user id. */
  id: string;
  /** The verified phone, in international form: +263771234567. */
  phone: string | null;
  email: string | null;
  /** The name given at sign up, if they signed up by email. */
  name: string | null;
  /** Their neighbourhood and town from sign up: "Mbare, Harare". */
  location: string | null;
}

let keys: ReturnType<typeof createRemoteJWKSet> | undefined;

async function verify(token: string): Promise<AuthUser | null> {
  const { SUPABASE_URL, SUPABASE_JWKS_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_JWKS_URL) {
    console.warn('SUPABASE_URL and SUPABASE_JWKS_URL are needed to check sign in.');
    return null;
  }
  keys ??= createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `${SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    if (!payload.sub) return null;
    // Supabase keeps phones without the plus.
    const phone = typeof payload.phone === 'string' && payload.phone ? `+${payload.phone.replace(/^\+/, '')}` : null;
    const email = typeof payload.email === 'string' && payload.email ? payload.email : null;
    const meta = payload.user_metadata as { name?: unknown; location?: unknown } | undefined;
    const text = (value: unknown) =>
      typeof value === 'string' && value.trim() ? value.trim() : null;
    return {
      id: payload.sub,
      phone,
      email,
      name: text(meta?.name),
      location: text(meta?.location),
    };
  } catch {
    return null;
  }
}

/** Notes who is signed in, when a valid token comes; lets everyone through. */
export const optionalAuth = createMiddleware<{ Variables: { authUser?: AuthUser } }>(
  async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const user = token ? await verify(token) : null;
    if (user) c.set('authUser', user);
    await next();
  },
);

/** Lets a request through only with a valid sign in token. */
export const requireAuth = createMiddleware<{ Variables: { authUser: AuthUser } }>(
  async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const user = token ? await verify(token) : null;
    if (!user) return c.json({ error: 'Sign in needed' }, 401);
    c.set('authUser', user);
    await next();
  },
);
