/**
 * The signed in person. The first time a phone signs in, the Supabase user is
 * linked to the person with that phone (the test accounts, or anyone added
 * before); anyone else signing in for the first time becomes a new person.
 *
 * Signing up takes only an email (or a phone). A verified phone is what lets
 * someone post, make offers and reach other people, so `phoneVerified` says
 * whether they have one yet. A phone belongs to one account only, which is
 * what keeps a ban in place.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, eq, isNull } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { dayMonth, paidUntil, settlePasses } from '../passes';
import { ErrorSchema, MeSchema } from '../schemas';
import { MOCK_CODE, supabaseAdmin } from '../supabaseAdmin';

export const meRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

const me = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Account'],
  summary: 'The signed in person',
  description:
    'Links the sign in to a person by phone the first time, and makes a new person for a new phone.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  responses: {
    200: { description: 'The signed in person', content: { 'application/json': { schema: MeSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

/** "Tarisai Moyo" as shown: "Tarisai M.". Full names are never shown. */
function shownName(name: string | null): string {
  if (!name) return '';
  const [first, ...rest] = name.split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first!;
}

type Person = typeof t.people.$inferSelect;

/**
 * Who each sign in is, kept for a few seconds: the app asks for several
 * things at once as someone signs in, and each request starts by finding the
 * person; one lookup now serves them all. Changes to the person here (name,
 * phone) update it at once (`rememberPerson`).
 */
const PERSON_FOR_MS = 15_000;
const people = new Map<string, { at: number; person: Promise<Person> }>();

/** Puts the person as just saved in place of what was kept. */
function rememberPerson(authUserId: string, person: Person) {
  people.set(authUserId, { at: Date.now(), person: Promise.resolve(person) });
}

/** The person for this sign in, linking or adding them as needed. */
export async function personFor(user: AuthUser): Promise<Person> {
  const kept = people.get(user.id);
  if (kept && Date.now() - kept.at < PERSON_FOR_MS) return kept.person;
  const person = findPerson(user);
  people.set(user.id, { at: Date.now(), person });
  person.catch(() => people.delete(user.id));
  return person;
}

/** "Last seen", noted at most every few minutes, and never waited for. */
const SEEN_EVERY_MS = 5 * 60_000;

async function findPerson(user: AuthUser): Promise<Person> {
  const now = new Date();
  const [linked] = await db.select().from(t.people).where(eq(t.people.authUserId, user.id));
  if (linked) {
    if (!linked.lastSeenAt || now.getTime() - linked.lastSeenAt.getTime() > SEEN_EVERY_MS) {
      void db
        .update(t.people)
        .set({ lastSeenAt: now })
        .where(eq(t.people.id, linked.id))
        .catch(() => undefined);
    }
    return linked;
  }
  if (user.phone) {
    const [byPhone] = await db
      .update(t.people)
      .set({ authUserId: user.id, lastSeenAt: now, phoneVerifiedAt: now })
      .where(and(eq(t.people.phone, user.phone), isNull(t.people.authUserId)))
      .returning();
    if (byPhone) return byPhone;
  }
  // A new person, with the name and place they gave at sign up (empty when
  // they signed up by phone, until asked).
  const [created] = await db
    .insert(t.people)
    .values({
      authUserId: user.id,
      phone: user.phone,
      email: user.email,
      displayName: shownName(user.name),
      location: user.location,
      phoneVerifiedAt: user.phone ? now : null,
      lastSeenAt: now,
    })
    .returning();
  return created!;
}

/** The person as the API returns them, with the stores they belong to. */
async function viewerOut(person: typeof t.people.$inferSelect) {
  await settlePasses();
  const rows = await db
    .select({
      id: t.stores.id,
      slug: t.stores.slug,
      name: t.stores.name,
      role: t.storeMembers.role,
      phone: t.stores.phone,
      verifiedAt: t.stores.verifiedAt,
    })
    .from(t.storeMembers)
    .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
    .where(
      and(
        eq(t.storeMembers.personId, person.id),
        isNull(t.storeMembers.removedAt),
        isNull(t.stores.closedAt),
      ),
    );
  return {
    id: person.id,
    displayName: person.displayName,
    phone: person.phone ?? undefined,
    phoneVerified: person.phoneVerifiedAt !== null,
    role: person.role,
    standing: person.standing,
    stores: await Promise.all(
      rows.map(async ({ phone, verifiedAt, ...store }) => {
        const [until, [waiting]] = await Promise.all([
          paidUntil(store.id),
          db
            .select({ id: t.verificationRequests.id })
            .from(t.verificationRequests)
            .where(and(eq(t.verificationRequests.storeId, store.id), eq(t.verificationRequests.state, 'pending')))
            .limit(1),
        ]);
        return {
          ...store,
          verified: verifiedAt !== null,
          verifyPending: Boolean(waiting),
          ...(until ? { paidUntil: dayMonth(until) } : {}),
          // Only its owner sees it here; buyers get it through Show contact.
          ...(phone && store.role === 'owner' ? { phone: `0${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}` } : {}),
        };
      }),
    ),
  };
}

meRoutes.openapi(me, async (c) => {
  const person = await personFor(c.get('authUser'));
  return c.json(await viewerOut(person), 200);
});

const name = createRoute({
  method: 'patch',
  path: '/me',
  tags: ['Account'],
  summary: 'Set your name',
  description: 'For someone who joined by phone, who has no name yet. Shown as first name and surname initial.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            firstName: z.string().trim().min(1, 'Enter your first name').max(50),
            surname: z.string().trim().min(1, 'Enter your surname').max(50),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'The signed in person', content: { 'application/json': { schema: MeSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

meRoutes.openapi(name, async (c) => {
  const { firstName, surname } = c.req.valid('json');
  const person = await personFor(c.get('authUser'));
  const [updated] = await db
    .update(t.people)
    .set({ displayName: shownName(`${firstName} ${surname}`) })
    .where(eq(t.people.id, person.id))
    .returning();
  rememberPerson(c.get('authUser').id, updated!);
  return c.json(await viewerOut(updated!), 200);
});

/** A Zimbabwe mobile number as +263771234567, or null when it is not one. */
function toPhone(typed: string): string | null {
  const digits = typed.replace(/\D/g, '');
  const local = digits.startsWith('263') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  return /^7\d{8}$/.test(local) ? `+263${local}` : null;
}

const phone = createRoute({
  method: 'post',
  path: '/me/phone',
  tags: ['Account'],
  summary: 'Verify your phone',
  description: `Saves the phone as verified. While SMS is not set up no code is sent and the code is always ${MOCK_CODE}. A phone belongs to one account only.`,
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            phone: z.string().openapi({ example: '0771234567' }),
            code: z.string().trim().openapi({ example: MOCK_CODE }),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'The signed in person', content: { 'application/json': { schema: MeSchema } } },
    400: { description: 'Not a number, or the wrong code', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    409: { description: 'The phone is on another account', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

meRoutes.openapi(phone, async (c) => {
  const body = c.req.valid('json');
  const number = toPhone(body.phone);
  if (!number) return c.json({ error: 'Enter a Zimbabwe mobile number, like 077 123 4567.' }, 400);
  if (body.code !== MOCK_CODE) return c.json({ error: 'That code is not right.' }, 400);
  const user = c.get('authUser');
  const person = await personFor(user);
  const taken = 'That number is already on another account.';
  const [other] = await db.select({ id: t.people.id }).from(t.people).where(eq(t.people.phone, number));
  if (other && other.id !== person.id) return c.json({ error: taken }, 409);
  // On the sign in too, so they can also sign in with it.
  const auth = await supabaseAdmin(`/users/${user.id}`, 'PUT', {
    phone: number.slice(1),
    phone_confirm: true,
  });
  if (auth.code === 'phone_exists' || auth.status === 422) return c.json({ error: taken }, 409);
  if (!auth.ok) throw new Error(`Saving the phone failed: ${auth.status}`);
  const [updated] = await db
    .update(t.people)
    .set({ phone: number, phoneVerifiedAt: new Date() })
    .where(eq(t.people.id, person.id))
    .returning();
  rememberPerson(user.id, updated!);
  return c.json(await viewerOut(updated!), 200);
});
