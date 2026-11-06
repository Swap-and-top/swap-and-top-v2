/**
 * Data requests (docs/product/staff-console.md, section 9): a user asking
 * for their data, or for their account to be deleted, under the Cyber and
 * Data Protection Act. Handled by a Trust and safety leader (or the super
 * admin), from the user's record, on anyone they may act on.
 *
 * `GET /staff/users/{id}/data` is everything we hold about them, as one
 * file. It is what they are owed: it never says who reported them, or what
 * our team noted, and each download is logged.
 *
 * `POST /staff/users/{id}/delete` needs a note, is logged, and cannot be
 * undone. Their name, phone, email and area go, as do their sign in, saved
 * listings and notifications; their listings and any stores they own close;
 * their offers still waiting are withdrawn. Deals, reports, decisions and
 * payments stay on record, under "Deleted user", as the law allows and the
 * other side of each needs. Refused for anyone on our team (take them off
 * first) and while banned or suspended: deleting frees the phone number, so
 * it would be a way around the ban. The row keeps its `authUserId` so a sign
 * in still in their browser finds this row and is turned away (app.ts),
 * rather than making a new account.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, desc, eq, inArray, isNull, notInArray, or } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { actorOf, mayActOn, targetsOf, type Actor, type Target } from '../moderation';
import { ErrorSchema } from '../schemas';
import { supabaseAdmin } from '../supabaseAdmin';
import { personFor } from './me';
import { deletePhotos } from '../r2';

export const dataRequestRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

export const DELETED_NAME = 'Deleted user';

const errors = {
  401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  403: { description: 'Not allowed', content: { 'application/json': { schema: ErrorSchema } } },
  404: { description: 'No such user', content: { 'application/json': { schema: ErrorSchema } } },
};

/** Why this actor may not handle this user's data request, if so. */
export function whyNoDataRequest(actor: Actor, target: Target | undefined): string | null {
  if (!actor.superAdmin && !actor.tsLead) return 'Only a Trust and safety leader handles data requests.';
  return mayActOn(actor, target);
}

/** Why this account cannot be deleted just now, if so. */
export function whyNoDelete(target: Target): string | null {
  if (target.role === 'super_admin' || target.rank !== null) return 'Take them off the team first.';
  if (target.standing === 'banned') return 'They are banned, so the account stays on record.';
  if (target.standing === 'suspended') return 'They are suspended, so the account stays until that ends.';
  return null;
}

const download = createRoute({
  method: 'get',
  path: '/staff/users/{id}/data',
  tags: ['Staff'],
  summary: 'Everything held about a user',
  description:
    'For a data request: their details, listings, offers, deals, reports, decisions, appeals, stores and payments, as one file. Trust and safety leaders, on someone they may act on. Each download is logged.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Their data', content: { 'application/json': { schema: z.record(z.string(), z.unknown()) } } },
    ...errors,
  },
});

dataRequestRoutes.openapi(download, async (c) => {
  const { id } = c.req.valid('param');
  const viewer = await personFor(c.get('authUser'));
  const [actor, targets] = await Promise.all([actorOf(viewer), targetsOf([id])]);
  const why = whyNoDataRequest(actor, targets.get(id));
  if (why) return c.json({ error: why }, targets.get(id) ? 403 : 404);

  const [[person], listings, offers, deals, reportsSent, reportsAbout, decisions, appeals, stores, payments, saved] =
    await Promise.all([
      db.select().from(t.people).where(eq(t.people.id, id)),
      db
        .select({
          title: t.listings.title,
          type: t.listings.type,
          category: t.listings.category,
          status: t.listings.status,
          location: t.listings.location,
          postedAt: t.listings.createdAt,
        })
        .from(t.listings)
        .where(eq(t.listings.ownerId, id))
        .orderBy(desc(t.listings.createdAt)),
      db
        .select({
          listing: t.listings.title,
          item: t.offers.itemName,
          cash: t.offers.cashAmount,
          currency: t.offers.currency,
          message: t.offers.message,
          state: t.offers.state,
          sentAt: t.offers.createdAt,
        })
        .from(t.offers)
        .innerJoin(t.listings, eq(t.listings.id, t.offers.listingId))
        .where(eq(t.offers.fromPersonId, id))
        .orderBy(desc(t.offers.createdAt)),
      db
        .select({
          listing: t.listings.title,
          state: t.dealChecks.state,
          source: t.dealChecks.source,
          askerId: t.dealChecks.askerId,
          askerAnswer: t.dealChecks.askerAnswer,
          ownerAnswer: t.dealChecks.ownerAnswer,
          at: t.dealChecks.createdAt,
        })
        .from(t.dealChecks)
        .innerJoin(t.listings, eq(t.listings.id, t.dealChecks.listingId))
        .where(or(eq(t.dealChecks.askerId, id), eq(t.dealChecks.ownerId, id)))
        .orderBy(desc(t.dealChecks.createdAt)),
      db
        .select({ reason: t.reports.reason, state: t.reports.state, at: t.reports.createdAt })
        .from(t.reports)
        .where(eq(t.reports.reporterId, id))
        .orderBy(desc(t.reports.createdAt)),
      // Never who sent it: reporters stay private.
      db
        .select({ reason: t.reports.reason, state: t.reports.state, at: t.reports.createdAt })
        .from(t.reports)
        .where(eq(t.reports.personId, id))
        .orderBy(desc(t.reports.createdAt)),
      // What was decided, not our team's own notes on it.
      db
        .select({
          kind: t.moderationActions.kind,
          reason: t.moderationActions.reason,
          at: t.moderationActions.createdAt,
          until: t.moderationActions.until,
          reversedAt: t.moderationActions.reversedAt,
        })
        .from(t.moderationActions)
        .where(eq(t.moderationActions.personId, id))
        .orderBy(desc(t.moderationActions.createdAt)),
      db
        .select({
          statement: t.appeals.statement,
          outcome: t.appeals.outcome,
          reason: t.appeals.reason,
          at: t.appeals.createdAt,
        })
        .from(t.appeals)
        .where(eq(t.appeals.personId, id)),
      db
        .select({ name: t.stores.name, role: t.storeMembers.role, addedAt: t.storeMembers.addedAt, removedAt: t.storeMembers.removedAt })
        .from(t.storeMembers)
        .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
        .where(eq(t.storeMembers.personId, id)),
      db
        .select({
          purpose: t.payments.purpose,
          amount: t.payments.amount,
          currency: t.payments.currency,
          status: t.payments.status,
          at: t.payments.createdAt,
        })
        .from(t.payments)
        .where(eq(t.payments.personId, id))
        .orderBy(desc(t.payments.createdAt)),
      db
        .select({ listing: t.listings.title })
        .from(t.savedListings)
        .innerJoin(t.listings, eq(t.listings.id, t.savedListings.listingId))
        .where(eq(t.savedListings.personId, id)),
    ]);

  await db.insert(t.staffLog).values({ actorId: viewer.id, action: 'person.export', targetPersonId: id, detail: {} });

  // As the file will have it: dates written out.
  const file = JSON.parse(
    JSON.stringify({
      preparedAt: new Date().toISOString(),
      details: person && {
        name: person.displayName,
        phone: person.phone,
        email: person.email,
        area: person.location,
        standing: person.standing,
        joinedAt: person.joinedAt,
        lastSeenAt: person.lastSeenAt,
      },
      stores,
      listings,
      offersSent: offers,
      deals: deals.map(({ askerId, askerAnswer, ownerAnswer, ...deal }) => ({
        ...deal,
        theirAnswer: askerId === id ? askerAnswer : ownerAnswer,
      })),
      savedListings: saved.map((row) => row.listing),
      reportsTheySent: reportsSent,
      reportsAboutThem: reportsAbout,
      decisionsAboutThem: decisions,
      appeals,
      payments,
    }),
  ) as Record<string, unknown>;
  return c.json(file, 200);
});

const remove = createRoute({
  method: 'post',
  path: '/staff/users/{id}/delete',
  tags: ['Staff'],
  summary: 'Delete a user\'s account',
  description:
    'For a data request: removes their name, phone, email, area and sign in, closes their listings and any stores they own, deletes the photos of those listings and the logos of those stores, and keeps deal, report and payment records under "Deleted user". Cannot be undone. Trust and safety leaders, with a note saying why, on someone they may act on; not anyone on our team, and not while banned or suspended.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            note: z.string({ error: 'Write a short note saying why' }).trim().min(2, 'Write a short note saying why').max(500),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Deleted', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    400: { description: 'Cannot be deleted just now', content: { 'application/json': { schema: ErrorSchema } } },
    ...errors,
  },
});

dataRequestRoutes.openapi(remove, async (c) => {
  const { id } = c.req.valid('param');
  const { note } = c.req.valid('json');
  const viewer = await personFor(c.get('authUser'));
  const [actor, targets] = await Promise.all([actorOf(viewer), targetsOf([id])]);
  const target = targets.get(id);
  const why = whyNoDataRequest(actor, target);
  if (why) return c.json({ error: why }, target ? 403 : 404);
  const blocked = whyNoDelete(target!);
  if (blocked) return c.json({ error: blocked }, 400);

  const [person] = await db
    .select({ authUserId: t.people.authUserId, deletedAt: t.people.deletedAt })
    .from(t.people)
    .where(eq(t.people.id, id));
  if (person?.deletedAt) return c.json({ error: 'This account is already deleted.' }, 400);

  const now = new Date();
  /** Photos of what they listed, taken off and deleted from R2 after. */
  const photos: string[] = [];
  await db.transaction(async (tx) => {
    // The stores they own close, as closing one does: off every page, with
    // its listings, kept on record.
    const owned = await tx
      .select({ id: t.storeMembers.storeId })
      .from(t.storeMembers)
      .innerJoin(t.stores, eq(t.stores.id, t.storeMembers.storeId))
      .where(
        and(
          eq(t.storeMembers.personId, id),
          eq(t.storeMembers.role, 'owner'),
          isNull(t.storeMembers.removedAt),
          isNull(t.stores.closedAt),
        ),
      );
    const storeIds = owned.map((row) => row.id);
    if (storeIds.length) {
      const logos = await tx
        .select({ logo: t.stores.logo })
        .from(t.stores)
        .where(inArray(t.stores.id, storeIds));
      photos.push(...logos.flatMap((row) => (row.logo ? [row.logo] : [])));
      await tx
        .update(t.stores)
        .set({ closedAt: now, phone: null, logo: null })
        .where(inArray(t.stores.id, storeIds));
    }
    await tx
      .update(t.listings)
      .set({ status: 'withdrawn', updatedAt: now })
      .where(
        and(
          notInArray(t.listings.status, ['withdrawn', 'removed']),
          or(
            and(eq(t.listings.ownerId, id), isNull(t.listings.storeId)),
            storeIds.length ? inArray(t.listings.storeId, storeIds) : undefined,
          ),
        ),
      );
    // Every photo of those listings, open or closed before: the items keep
    // their names on record, not pictures of someone's things.
    const theirs = or(
      and(eq(t.listings.ownerId, id), isNull(t.listings.storeId)),
      storeIds.length ? inArray(t.listings.storeId, storeIds) : undefined,
    );
    const [sold, swapped] = await Promise.all([
      tx
        .select({ itemId: t.saleDetails.itemId })
        .from(t.saleDetails)
        .innerJoin(t.listings, eq(t.listings.id, t.saleDetails.listingId))
        .where(theirs),
      tx
        .select({ itemId: t.swapDetails.hasItemId })
        .from(t.swapDetails)
        .innerJoin(t.listings, eq(t.listings.id, t.swapDetails.listingId))
        .where(theirs),
    ]);
    const itemIds = [...sold, ...swapped].map((row) => row.itemId);
    if (itemIds.length) {
      const cleared = await tx
        .select({ images: t.items.images })
        .from(t.items)
        .where(inArray(t.items.id, itemIds));
      photos.push(...cleared.flatMap((row) => row.images));
      await tx.update(t.items).set({ images: [] }).where(inArray(t.items.id, itemIds));
    }
    await tx
      .update(t.storeMembers)
      .set({ removedAt: now })
      .where(and(eq(t.storeMembers.personId, id), isNull(t.storeMembers.removedAt)));
    await tx
      .update(t.offers)
      .set({ state: 'withdrawn', answeredAt: now })
      .where(and(eq(t.offers.fromPersonId, id), eq(t.offers.state, 'pending')));
    await tx.delete(t.savedListings).where(eq(t.savedListings.personId, id));
    await tx.delete(t.notifications).where(eq(t.notifications.personId, id));
    await tx.update(t.reveals).set({ viewerId: null }).where(eq(t.reveals.viewerId, id));
    await tx.update(t.storeContacts).set({ viewerId: null }).where(eq(t.storeContacts.viewerId, id));
    await tx
      .update(t.people)
      .set({ displayName: DELETED_NAME, phone: null, email: null, location: null, lastSeenAt: null, deletedAt: now })
      .where(eq(t.people.id, id));
    await tx.insert(t.staffLog).values({ actorId: viewer.id, action: 'person.delete', targetPersonId: id, detail: { note } });
  });

  void deletePhotos(photos);

  // Their sign in, last: if this fails the row still turns them away.
  if (person?.authUserId) {
    const gone = await supabaseAdmin(`/users/${person.authUserId}`, 'DELETE', {}).catch(() => null);
    if (!gone?.ok) console.warn(`Could not delete the sign in of ${id}.`);
  }
  return c.json({ ok: true }, 200);
});
