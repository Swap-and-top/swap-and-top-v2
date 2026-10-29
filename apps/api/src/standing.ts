/**
 * A person's standing over time (docs/features/moderation.md, "Account
 * standing"). A suspension ends by itself: once its `suspendedUntil` has
 * passed, the person is back to posting, as warned, since the record stays.
 * Run with the store pass check, as pages are read.
 */

import { and, eq, lte } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';

export async function liftEndedSuspensions(now = new Date()): Promise<void> {
  await db
    .update(t.people)
    .set({ standing: 'warned', suspendedUntil: null })
    .where(and(eq(t.people.standing, 'suspended'), lte(t.people.suspendedUntil, now)));
}
