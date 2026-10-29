/**
 * What Trust and safety may do to whom, and what an action does
 * (docs/product/staff-console.md section 9, docs/features/moderation.md).
 * Reports (routes/reports.ts) and People (routes/people.ts) both act
 * through here, so the rules and their effects are the same either way.
 *
 * Who may act on whom: a Trust and safety member on ordinary users; a lead
 * also on members of our team; the super admin also on leads. Nobody acts
 * on themselves, on someone they run a store with, on a listing of a store
 * they run, or on the super admin.
 */

import { and, eq, inArray, isNull, ne, notInArray } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';
import { staffOf } from './staff';

export type Reason = (typeof t.reportReason.enumValues)[number];
export type ActionKind = 'warning' | 'removal' | 'suspension' | 'ban';

/** How a reason reads in a sentence to the person acted on. */
export const REASON_WORDS: Record<Reason, string> = {
  stolen: 'possibly stolen',
  'not-as-described': 'not as described',
  fake: 'fake or misleading',
  duplicate: 'a duplicate listing',
  offensive: 'offensive',
  'wrong-category': 'in the wrong category',
  'no-show': 'not showing up or backing out of a deal',
  other: 'breaking our rules',
};

export const SUSPENSION_DAYS = 7;
const DAY = 24 * 60 * 60_000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dayMonth = (at: Date) => `${at.getDate()} ${MONTHS[at.getMonth()]}`;

interface Viewer {
  id: string;
  role: string;
  phone: string | null;
}

/** The one acting: their rank on the team and the stores they run. */
export async function actorOf(viewer: Viewer) {
  const [staff, stores] = await Promise.all([
    staffOf(viewer),
    db
      .select({ storeId: t.storeMembers.storeId })
      .from(t.storeMembers)
      .where(and(eq(t.storeMembers.personId, viewer.id), isNull(t.storeMembers.removedAt))),
  ]);
  return {
    id: viewer.id,
    superAdmin: viewer.role === 'super_admin',
    tsLead: staff.some((row) => row.department === 'trust_safety' && row.lead),
    stores: new Set(stores.map((row) => row.storeId)),
  };
}

export type Actor = Awaited<ReturnType<typeof actorOf>>;

/** The people acted on: who they are, their rank on our team, their stores. */
export async function targetsOf(personIds: string[]) {
  if (personIds.length === 0) return new Map<string, Target>();
  const [people, staffRows, stores] = await Promise.all([
    db
      .select({ id: t.people.id, name: t.people.displayName, role: t.people.role, standing: t.people.standing })
      .from(t.people)
      .where(inArray(t.people.id, personIds)),
    db
      .select({ personId: t.staffDepartments.personId, lead: t.staffDepartments.lead })
      .from(t.staffDepartments)
      .where(inArray(t.staffDepartments.personId, personIds)),
    db
      .select({ personId: t.storeMembers.personId, storeId: t.storeMembers.storeId })
      .from(t.storeMembers)
      .where(and(inArray(t.storeMembers.personId, personIds), isNull(t.storeMembers.removedAt))),
  ]);
  return new Map<string, Target>(
    people.map((row) => {
      const theirs = staffRows.filter((staff) => staff.personId === row.id);
      return [
        row.id,
        {
          ...row,
          rank: theirs.some((staff) => staff.lead) ? 'lead' : theirs.length ? 'member' : null,
          stores: stores.filter((store) => store.personId === row.id).map((store) => store.storeId),
        },
      ];
    }),
  );
}

export interface Target {
  id: string;
  name: string;
  role: string;
  standing: string;
  rank: 'lead' | 'member' | null;
  stores: string[];
}

/** Whether this actor may act on this person (about a listing of this
    store, where there is one); why not, if not. */
export function mayActOn(actor: Actor, target: Target | undefined, storeId?: string | null): string | null {
  if (!target) return 'That person is not there any more.';
  if (target.id === actor.id) return 'This is about you, so someone else has to handle it.';
  if (storeId && actor.stores.has(storeId)) return 'You run this store, so someone else has to handle it.';
  if (target.stores.some((store) => actor.stores.has(store))) {
    return 'You run a store with this person, so someone else has to handle it.';
  }
  if (target.role === 'super_admin') return 'Nobody on the team acts on the super admin.';
  if (target.rank === 'lead' && !actor.superAdmin) {
    return 'This person leads part of our team, so only the super admin can handle it.';
  }
  if (target.rank === 'member' && !actor.superAdmin && !actor.tsLead) {
    return 'This person is on our team, so a Trust and safety lead has to handle it.';
  }
  return null;
}

/** Whether this actor may ban: Trust and safety leads and the super admin. */
export const mayBan = (actor: Actor) => actor.superAdmin || actor.tsLead;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * What an action does, inside the caller's transaction. A warning or a
 * removal marks them warned (never undoing a suspension or a ban); a
 * removal takes the listing down; a suspension hides their listings and
 * stops them posting for 7 days; a ban does so for good and removes every
 * listing. Returns when a suspension ends.
 */
export async function applyAction(
  tx: Tx,
  { personId, listingId, kind, now }: { personId: string; listingId?: string | null; kind: ActionKind; now: Date },
): Promise<Date | null> {
  const until = kind === 'suspension' ? new Date(now.getTime() + SUSPENSION_DAYS * DAY) : null;
  if (kind === 'removal' && listingId) {
    await tx.update(t.listings).set({ status: 'removed', updatedAt: now }).where(eq(t.listings.id, listingId));
  }
  if (kind === 'warning' || kind === 'removal') {
    await tx
      .update(t.people)
      .set({ standing: 'warned' })
      .where(and(eq(t.people.id, personId), inArray(t.people.standing, ['good', 'limited'])));
  }
  if (kind === 'suspension') {
    await tx
      .update(t.people)
      .set({ standing: 'suspended', suspendedUntil: until })
      .where(and(eq(t.people.id, personId), ne(t.people.standing, 'banned')));
  }
  if (kind === 'ban') {
    await tx.update(t.people).set({ standing: 'banned', suspendedUntil: null }).where(eq(t.people.id, personId));
    await tx
      .update(t.listings)
      .set({ status: 'removed', updatedAt: now })
      .where(and(eq(t.listings.ownerId, personId), notInArray(t.listings.status, ['withdrawn', 'removed'])));
  }
  return until;
}

/** What the person acted on is told: what and why, never who reported. */
export function actionText(
  kind: ActionKind,
  reason: Reason,
  { listingTitle, until, fromReport }: { listingTitle?: string; until: Date | null; fromReport: boolean },
): string {
  const why = REASON_WORDS[reason];
  const about = listingTitle ? `your listing ${listingTitle}` : 'you';
  const after = fromReport ? `after a report about ${about}` : 'by our team';
  const text = {
    warning: fromReport
      ? `A report about ${about} (${why}) was upheld. This is a warning on your account.`
      : `This is a warning on your account from our team (${why}).`,
    removal: `We removed your listing ${listingTitle ?? ''} after a report (${why}).`,
    suspension: `Your account is suspended until ${until ? dayMonth(until) : ''} ${after} (${why}). Your listings are hidden until then and you cannot post.`,
    ban: `Your account is banned ${after} (${why}).`,
  }[kind];
  return `${text} Tap to see it, or to appeal.`;
}

/**
 * Works a person's standing out again from the actions still in force
 * (after one is overturned): banned while a ban stands; suspended while a
 * suspension has time left; warned with any other action on record; else
 * good.
 */
export async function resettleStanding(tx: Tx, personId: string, now: Date): Promise<void> {
  const active = await tx
    .select({ kind: t.moderationActions.kind, until: t.moderationActions.until })
    .from(t.moderationActions)
    .where(
      and(
        eq(t.moderationActions.personId, personId),
        isNull(t.moderationActions.reversedAt),
        ne(t.moderationActions.kind, 'none'),
      ),
    );
  const suspendedUntil = active
    .filter((row) => row.kind === 'suspension' && row.until && row.until > now)
    .map((row) => row.until!)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const standing = active.some((row) => row.kind === 'ban')
    ? 'banned'
    : suspendedUntil
      ? 'suspended'
      : active.length
        ? 'warned'
        : 'good';
  await tx
    .update(t.people)
    .set({ standing, suspendedUntil: standing === 'suspended' ? suspendedUntil : null })
    .where(eq(t.people.id, personId));
}

/**
 * Undoes an overturned action, inside the caller's transaction, once its
 * `reversedAt` is set: a removed listing goes live again, a ban gives back
 * the listings it removed (not those another action still keeps down), and
 * the standing is worked out again. The record of the action stays.
 */
export async function undoAction(
  tx: Tx,
  action: { personId: string; listingId: string | null; kind: string },
  now: Date,
): Promise<void> {
  const keptDown = (
    await tx
      .select({ listingId: t.moderationActions.listingId })
      .from(t.moderationActions)
      .where(
        and(
          eq(t.moderationActions.personId, action.personId),
          eq(t.moderationActions.kind, 'removal'),
          isNull(t.moderationActions.reversedAt),
        ),
      )
  )
    .map((row) => row.listingId)
    .filter((id): id is string => Boolean(id));
  if (action.kind === 'removal' && action.listingId && !keptDown.includes(action.listingId)) {
    await tx
      .update(t.listings)
      .set({ status: 'live', updatedAt: now })
      .where(and(eq(t.listings.id, action.listingId), eq(t.listings.status, 'removed')));
  }
  if (action.kind === 'ban') {
    await tx
      .update(t.listings)
      .set({ status: 'live', updatedAt: now })
      .where(
        and(
          eq(t.listings.ownerId, action.personId),
          eq(t.listings.status, 'removed'),
          keptDown.length ? notInArray(t.listings.id, keptDown) : undefined,
        ),
      );
  }
  await resettleStanding(tx, action.personId, now);
}
