/**
 * The sample offers, deal checks, saved listings and notifications, as the
 * mock data has them, so those pages look the same on the API as they did.
 * Part of the seed; also run on its own, which empties and refills just
 * these tables:
 * `pnpm --filter @snt/api db:seed-activity`.
 */

import { mockDealConfirmations, mockNotifications, SAMPLE_OFFERS, SAMPLE_SAVED } from '@snt/core';
import { db } from './client';
import * as t from './schema';

const HOUR = 60 * 60 * 1000;

/** "3h ago", "Yesterday", "8 days ago" → when, counting back from now. */
function when(label: string, now: Date): Date {
  const hours = /^(\d+)h ago$/.exec(label);
  if (hours) return new Date(now.getTime() - Number(hours[1]) * HOUR);
  const minutes = /^(\d+) minutes ago$/.exec(label);
  if (minutes) return new Date(now.getTime() - Number(minutes[1]) * 60 * 1000);
  const days = /^(\d+) days ago$/.exec(label);
  if (days) return new Date(now.getTime() - Number(days[1]) * 24 * HOUR);
  if (label === 'Yesterday') return new Date(now.getTime() - 24 * HOUR);
  if (label === 'Last week') return new Date(now.getTime() - 7 * 24 * HOUR);
  if (label === 'Today') return new Date(now.getTime() - 5 * HOUR);
  return now;
}

const answer = (value: string) => (value === 'unanswered' ? null : (value as 'yes' | 'no' | 'not-yet'));

export async function seedActivity() {
  await db.delete(t.notifications);
  await db.delete(t.savedListings);
  await db.delete(t.dealChecks);
  await db.delete(t.offers);
  const now = new Date();

  await db.insert(t.offers).values(
    SAMPLE_OFFERS.map((offer) => {
      const sent = when(offer.sentLabel, now);
      return {
        id: offer.id,
        listingId: offer.listingId,
        fromPersonId: offer.fromUserId,
        itemListingId: offer.item?.listingId ?? null,
        itemName: offer.item?.name ?? null,
        itemCondition: offer.item?.condition ?? null,
        cashAmount: offer.cashAmount,
        cashFrom: offer.cashFrom,
        message: offer.message ?? null,
        reachOn: offer.reachOn ?? [],
        state: offer.state,
        createdAt: sent,
        answeredAt: offer.state === 'pending' ? null : new Date(sent.getTime() + HOUR),
      };
    }),
  );

  await db.insert(t.dealChecks).values(
    mockDealConfirmations.map((deal) => ({
      id: deal.id,
      source: deal.source,
      offerId: deal.offerId ?? null,
      // The sample reveals are not stored, so a reveal's deal check stands alone.
      revealId: null,
      listingId: deal.listingId,
      askerId: deal.askerId,
      ownerId: deal.ownerId,
      askerAnswer: answer(deal.askerAnswer),
      ownerAnswer: answer(deal.ownerAnswer),
      state: deal.state,
      promptedAt: new Date(deal.promptedAt),
      lapsesAt: new Date(deal.lapsesAt),
      resolvedAt: deal.state === 'confirmed' ? new Date(deal.promptedAt) : null,
    })),
  );

  // Tarisai's saved listings, the first the newest.
  await db.insert(t.savedListings).values(
    SAMPLE_SAVED.map((listingId, index) => ({
      personId: 'u-tarisai',
      listingId,
      savedAt: new Date(now.getTime() - (index + 1) * 24 * HOUR),
    })),
  );

  // Tarisai's, and Kopje Computers' in the Store console.
  await db.insert(t.notifications).values(
    mockNotifications.map((n) => {
      const at = when(n.atLabel, now);
      return {
        id: n.id,
        personId: n.audience === 'user' ? 'u-tarisai' : null,
        storeId: n.audience === 'store' ? 's-kopje' : null,
        kind: n.kind,
        text: n.text,
        href: n.href,
        readAt: n.read ? at : null,
        createdAt: at,
      };
    }),
  );

  console.log(
    `Seeded ${SAMPLE_OFFERS.length} offers, ${mockDealConfirmations.length} deal checks, ` +
      `${SAMPLE_SAVED.length} saved listings and ${mockNotifications.length} notifications.`,
  );
}
