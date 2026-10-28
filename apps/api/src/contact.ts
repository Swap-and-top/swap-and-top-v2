/**
 * How to reach someone, given only once a check allows it: on Show contact
 * (routes/reveals.ts) and once an offer is accepted (routes/offers.ts).
 * Numbers never go out in pages or lists, so they cannot be collected in
 * bulk. A person is reached on their verified phone; a store on its own
 * number, else its owner's. Calls and WhatsApp, both on that number: email
 * and Messenger have no stored values yet.
 */

import { z } from '@hono/zod-openapi';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from './db/client';
import * as t from './db/schema';

export const ContactSchema = z
  .object({
    /** "077 123 4567" */
    phone: z.string(),
    call: z.boolean(),
    whatsapp: z.boolean(),
  })
  .openapi('Contact');

export type Contact = z.infer<typeof ContactSchema>;

/** "+263771234567" → "077 123 4567". */
export function localPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^263/, '');
  const local = `0${digits}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`.trim();
}

/** A person's phone, in the +263 form; null without one. */
export async function personPhone(personId: string): Promise<string | null> {
  const [row] = await db.select({ phone: t.people.phone }).from(t.people).where(eq(t.people.id, personId));
  return row?.phone ?? null;
}

/** A store's own number, else its owner's; null without either. */
export async function storePhone(storeId: string): Promise<string | null> {
  const [store] = await db.select({ phone: t.stores.phone }).from(t.stores).where(eq(t.stores.id, storeId));
  if (store?.phone) return store.phone;
  const [owner] = await db
    .select({ phone: t.people.phone })
    .from(t.storeMembers)
    .innerJoin(t.people, eq(t.people.id, t.storeMembers.personId))
    .where(and(eq(t.storeMembers.storeId, storeId), eq(t.storeMembers.role, 'owner'), isNull(t.storeMembers.removedAt)));
  return owner?.phone ?? null;
}

/** The contact for a number and the ways chosen; null when there is no
    number, or neither calls nor WhatsApp were chosen. */
export function contactOf(phone: string | null, ways: readonly string[]): Contact | null {
  const call = ways.includes('call');
  const whatsapp = ways.includes('whatsapp');
  if (!phone || (!call && !whatsapp)) return null;
  return { phone: localPhone(phone), call, whatsapp };
}

/** How to reach the seller of a listing, on the ways the listing offers. */
export async function contactForListing(listing: typeof t.listings.$inferSelect): Promise<Contact | null> {
  const phone = listing.storeId ? await storePhone(listing.storeId) : await personPhone(listing.ownerId);
  return contactOf(phone, listing.contactChannels);
}
