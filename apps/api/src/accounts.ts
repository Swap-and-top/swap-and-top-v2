/**
 * Accounts and sign in: our own, with Better Auth, in our own database
 * (the four `auth_...` tables in db/schema.ts). Its endpoints are under
 * /api/auth (app.ts), called by the web app's lib/account.ts.
 *
 * - Email and password. A new email is verified with a code before it can
 *   sign in; a forgotten password is reset by a link sent to the email.
 * - Phone and a code. A number seen for the first time makes an account.
 *
 * A sign in is a session kept in the database and named by a cookie the
 * page's scripts cannot read. The cookie also carries a signed copy of who
 * it is for, good for five minutes, so most requests need no trip to the
 * database to know who is asking.
 *
 * A new email in Settings takes the place of the old one only once the
 * code sent to it is entered.
 *
 * Codes: see messages.ts. Signing in by an email code and resetting a
 * password by a code are switched off (`disabledPaths`): with the mock
 * code they would open any account.
 *
 * Settings: AUTH_SECRET (signs sessions and the staff pass; a long random
 * string, different in each environment) and APP_URL (the site's own
 * address, such as https://sntstaging.gretaworksdigital.com).
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { bearer, emailOTP, phoneNumber } from 'better-auth/plugins';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';
import { MOCK_CODE, emailReady, isTestPhone, sendEmail, smsReady } from './messages';

const LIVE = process.env.APP_ENV === 'production' || process.env.VERCEL_ENV === 'production';

/** The secret that signs sessions. On localhost, and while the site is
    being built (when nobody signs in), one stands in if the setting is
    not there; a running server of ours never uses it. */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  const building = process.env.NEXT_PHASE === 'phase-production-build';
  if ((LIVE || process.env.APP_HOST) && !building) throw new Error('AUTH_SECRET is needed for sign in.');
  return 'local-development-only-not-a-secret';
}

const APP_URL = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/** The email an account made by phone is given, as Better Auth needs one.
    Never shown, never written to. */
const NO_EMAIL = '@phone.swapandtop.invalid';
export const isStandInEmail = (email: string) => email.endsWith(NO_EMAIL);

/** Passwords brought over from Supabase are bcrypt; new ones are scrypt. */
const isBcrypt = (hash: string) => /^\$2[aby]\$/.test(hash);

/** A password hashed as new ones are kept. */
export const hashOf = (password: string) => hashPassword(password);

export async function passwordMatches(hash: string, password: string): Promise<boolean> {
  return isBcrypt(hash) ? bcrypt.compare(password, hash) : verifyPassword({ hash, password });
}

export const auth = betterAuth({
  appName: 'Swap & Top',
  baseURL: APP_URL,
  basePath: '/api/auth',
  secret: authSecret(),
  // On localhost (no APP_URL set), also a phone on the same network, by
  // the laptop's address. A server of ours takes its own address only.
  trustedOrigins: (request) => (LIVE || process.env.APP_URL ? [] : [request?.headers.get('origin')]),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: t.authUsers,
      session: t.authSessions,
      account: t.authAccounts,
      verification: t.authVerifications,
    },
  }),
  advanced: { database: { generateId: () => crypto.randomUUID() } },
  user: {
    additionalFields: { location: { type: 'string', required: false } },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // An email is verified with its code before it can sign in.
    requireEmailVerification: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    password: { hash: hashPassword, verify: ({ hash, password }) => passwordMatches(hash, password) },
    sendResetPassword: async ({ user, token }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Swap & Top password',
        text: `Open this link to choose a new password. It works for one hour.\n\n${APP_URL}/signin/reset?token=${token}\n\nIf you did not ask for this, ignore this email.`,
      });
    },
  },
  emailVerification: {
    // The user's record keeps the email they sign in with.
    afterEmailVerification: async (user) => {
      await db.update(t.people).set({ email: user.email }).where(eq(t.people.authUserId, user.id));
    },
  },
  plugins: [
    // For scripts and tests: the session's token as a Bearer token.
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      disableSignUp: true,
      // A new email, in Settings: changed once its code is entered.
      changeEmail: { enabled: true },
      generateOTP: () => (emailReady ? undefined : MOCK_CODE),
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== 'email-verification' && type !== 'change-email') return;
        await sendEmail({
          to: email,
          subject: 'Your Swap & Top code',
          text: `Your code is ${otp}. It works for five minutes.`,
        });
      },
    }),
    phoneNumber({
      phoneNumberValidator: (phone) => /^\+[1-9]\d{7,14}$/.test(phone),
      // Until SMS is set up only our test numbers get in, with the mock code.
      sendOTP: async ({ phoneNumber: phone }) => {
        if (!smsReady && !isTestPhone(phone)) {
          throw new APIError('BAD_REQUEST', { message: 'SMS is not set up yet.' });
        }
      },
      verifyOTP: async ({ phoneNumber: phone, code }) => !smsReady && isTestPhone(phone) && code === MOCK_CODE,
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/\D/g, '')}${NO_EMAIL}`,
        getTempName: () => '',
      },
    }),
  ],
  disabledPaths: [
    '/sign-in/email-otp',
    '/email-otp/request-password-reset',
    '/forget-password/email-otp',
    '/email-otp/reset-password',
    '/phone-number/request-password-reset',
    '/phone-number/reset-password',
  ],
});
