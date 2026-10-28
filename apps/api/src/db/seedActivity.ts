/**
 * The sample offers, deal checks, saved listings and notifications, as the
 * mock data has them, so those pages look the same on the API as they did.
 * Part of the seed; also run on its own, which empties and refills just
 * these tables:
 * `pnpm --filter @snt/api db:seed-activity`.
 */

import { mockDealConfirmations, mockNotifications, mockUsers, SAMPLE_OFFERS, SAMPLE_SAVED } from '@snt/core';
import { inArray } from 'drizzle-orm';
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

/**
 * The sample boosts: one of a store's (the Dell, in Kopje's console) and one
 * of each other kind, so the Sponsored label shows on every kind of card.
 * Started some days back, running some days on.
 */
const SAMPLE_BOOSTS = [
  { listingId: 'l-dell-latitude-7490', dailyBudget: 3, startedDaysAgo: 7, daysLeft: 7 },
  { listingId: 'l-iphone-11-128', dailyBudget: 2, startedDaysAgo: 2, daysLeft: 5 },
  { listingId: 'l-ps4-for-xbox', dailyBudget: 1, startedDaysAgo: 2, daysLeft: 5 },
  { listingId: 'l-galaxy-swap', dailyBudget: 3, startedDaysAgo: 4, daysLeft: 3 },
  { listingId: 'l-rtx-wanted', dailyBudget: 2, startedDaysAgo: 1, daysLeft: 6 },
  { listingId: 'l-galaxy-s21-wanted', dailyBudget: 1, startedDaysAgo: 2, daysLeft: 30 },
];

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
        // A store's account sent it as the store (Kopje's, from Leads).
        fromStoreId: offer.fromStoreId ?? mockUsers.find((user) => user.id === offer.fromUserId)?.storeId ?? null,
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

  // The sample boosts, put back as they were; real ones are left alone.
  const boostIds = SAMPLE_BOOSTS.map((boost) => `b-sample-${boost.listingId}`);
  await db.delete(t.boosts).where(inArray(t.boosts.id, boostIds));
  const owners = await db
    .select({ id: t.listings.id, ownerId: t.listings.ownerId })
    .from(t.listings)
    .where(inArray(t.listings.id, SAMPLE_BOOSTS.map((boost) => boost.listingId)));
  const boosts = SAMPLE_BOOSTS.flatMap((boost) => {
    const owner = owners.find((row) => row.id === boost.listingId);
    if (!owner) return [];
    return [
      {
        id: `b-sample-${boost.listingId}`,
        listingId: boost.listingId,
        boughtById: owner.ownerId,
        dailyBudget: boost.dailyBudget,
        startsAt: new Date(now.getTime() - boost.startedDaysAgo * 24 * HOUR),
        endsAt: new Date(now.getTime() + boost.daysLeft * 24 * HOUR),
      },
    ];
  });
  if (boosts.length) await db.insert(t.boosts).values(boosts);

  console.log(
    `Seeded ${SAMPLE_OFFERS.length} offers, ${mockDealConfirmations.length} deal checks, ` +
      `${SAMPLE_SAVED.length} saved listings, ${mockNotifications.length} notifications and ${boosts.length} boosts.`,
  );
}
