/**
 * Offers — made and received.
 *
 * One list holds both: an offer is "received" when it is on one of the current
 * user's listings and "made" when it is from them. Seeded with a few sample
 * offers so both sides of the flow can be walked: two on Tarisai's MacBook
 * swap and one on her wanted post, and four she has sent.
 *
 * Every change is optimistic, like saving: the list changes at once and
 * is put back if the server refuses. There is no server yet — `persistOffer`
 * is where its call goes.
 */

import { create } from 'zustand';
import { CURRENT_USER_ID } from '../mock/users';
import type { Offer, OfferDraft, OfferState } from '../types/offer';

const SAMPLE_OFFERS: Offer[] = [
  // A trade-in offer to a dealer: towards Kopje Computers' ThinkPad, which
  // takes swaps. It shows on the dealer console's Trade-ins.
  {
    id: 'o-chipo-thinkpad-tradein',
    listingId: 'l-thinkpad-t480',
    fromUserId: 'u-chipo',
    item: { name: 'MacBook Air 2015, Core i5', condition: 'fair' },
    cashAmount: 150,
    cashFrom: 'offerer',
    message: 'Works well, small dent on the lid. Can bring it in today.',
    reachOn: ['whatsapp'],
    state: 'pending',
    sentLabel: '1h ago',
  },
  {
    id: 'o-kopje-latitude',
    listingId: 'l-macbook-swap',
    fromUserId: 'u-kopje',
    item: {
      listingId: 'l-dell-latitude-7490',
      name: 'Dell Latitude 7490',
      condition: 'good',
    },
    cashAmount: 260,
    cashFrom: 'owner',
    message:
      'Core i7, 16GB, 512GB SSD, in the shop now. $260 on top of your MacBook and it is yours today.',
    state: 'pending',
    sentLabel: '3h ago',
    counted: true,
  },
  {
    id: 'o-chipo-thinkpad',
    listingId: 'l-macbook-swap',
    fromUserId: 'u-chipo',
    item: { name: 'ThinkPad T470s, Core i7', condition: 'fair' },
    cashAmount: 180,
    cashFrom: 'owner',
    message: 'i7 with 16GB. Battery is tired, hence the lower top up.',
    state: 'pending',
    sentLabel: 'Yesterday',
    counted: true,
  },
  {
    id: 'o-avgames-dualsense',
    listingId: 'l-ps5-controller-wanted',
    fromUserId: 'u-avgames',
    item: { name: 'PS5 DualSense, white', condition: 'like-new' },
    cashAmount: 42,
    cashFrom: 'owner',
    message: 'Boxed, three months old. Collect in Avondale.',
    state: 'pending',
    sentLabel: '2h ago',
    counted: true,
  },
  {
    id: 'o-tarisai-redmi',
    listingId: 'l-redmi-wanted',
    fromUserId: CURRENT_USER_ID,
    item: { name: 'Redmi Note 12, 128GB', condition: 'good' },
    cashAmount: 165,
    cashFrom: 'owner',
    message: 'Bought in March, never dropped. Charger and case included.',
    state: 'pending',
    sentLabel: '4h ago',
    counted: true,
  },
  // More Tarisai has sent, one in each state, for her Offers, Made.
  {
    id: 'o-tarisai-rx580',
    listingId: 'l-gtx-1650-swap',
    fromUserId: CURRENT_USER_ID,
    item: { name: 'Sapphire RX 580 8GB', condition: 'good' },
    cashAmount: 0,
    cashFrom: 'none',
    message: 'Never mined on, fans cleaned last month. Straight swap?',
    state: 'accepted',
    sentLabel: 'Yesterday',
  },
  {
    id: 'o-tarisai-thinkpad',
    listingId: 'l-thinkpad-t480',
    fromUserId: CURRENT_USER_ID,
    item: { name: 'Dell Inspiron 15, Core i5', condition: 'good' },
    cashAmount: 120,
    cashFrom: 'offerer',
    message: '8GB, new battery. I can add $120 and bring it in on Saturday.',
    state: 'pending',
    sentLabel: '6h ago',
  },
  {
    id: 'o-tarisai-sodimm',
    listingId: 'l-sodimm-wanted',
    fromUserId: CURRENT_USER_ID,
    item: { name: 'Kingston 16GB DDR4 SODIMM pair', condition: 'like-new' },
    cashAmount: 55,
    cashFrom: 'owner',
    message: 'Out of my old laptop, tested and working.',
    state: 'declined',
    sentLabel: '3 days ago',
  },
  // More the shop has sent, in each state, for the console's "Offers sent".
  {
    id: 'o-kopje-redmi',
    listingId: 'l-redmi-wanted',
    fromUserId: 'u-kopje',
    item: {
      listingId: 'l-redmi-note-12',
      name: 'Redmi Note 12 128GB',
      condition: 'good',
    },
    cashAmount: 160,
    cashFrom: 'owner',
    message: 'In the shop now, with a charger. $160, or come and see it first.',
    reachOn: ['whatsapp', 'call'],
    state: 'accepted',
    sentLabel: 'Yesterday',
  },
  {
    id: 'o-kopje-elitedesk',
    listingId: 'l-cad-desktop-swap',
    fromUserId: 'u-kopje',
    item: {
      listingId: 'l-hp-elitedesk-800',
      name: 'HP EliteDesk 800 G3',
      condition: 'good',
    },
    cashAmount: 180,
    cashFrom: 'owner',
    message: 'Core i7, 16GB, can add a graphics card. Bring your i3 tower in.',
    state: 'declined',
    sentLabel: '2 days ago',
  },
  {
    id: 'o-kopje-rtx',
    listingId: 'l-rtx-wanted',
    fromUserId: 'u-kopje',
    item: { name: 'RTX 3060 12GB, sourced to order', condition: 'boxed-new' },
    cashAmount: 255,
    cashFrom: 'owner',
    message: 'I can have one here by Friday.',
    state: 'withdrawn',
    sentLabel: '3 days ago',
  },
];

interface OfferStore {
  offers: Offer[];
  add: (offer: Offer) => void;
  remove: (offerId: string) => void;
  setState: (offerId: string, state: OfferState) => void;
}

export const useOfferStore = create<OfferStore>((set) => ({
  offers: SAMPLE_OFFERS,
  add: (offer) => set((store) => ({ offers: [offer, ...store.offers] })),
  remove: (offerId) =>
    set((store) => ({
      offers: store.offers.filter((offer) => offer.id !== offerId),
    })),
  setState: (offerId, state) =>
    set((store) => ({
      offers: store.offers.map((offer) =>
        offer.id === offerId ? { ...offer, state } : offer,
      ),
    })),
}));

/**
 * Tells the server about a new offer or a change to one. There is no server
 * yet: this simply succeeds. When the API exists its call goes here and
 * nothing else changes. It must reject when the change did not happen.
 */
export async function persistOffer(
  _offerId: string,
  _change: 'sent' | OfferState,
): Promise<void> {
  await Promise.resolve();
}

let sequence = 0;

/**
 * Sends an offer optimistically: it is in the list at once, and taken out
 * again if the server refuses. Resolves with the offer once it is confirmed.
 */
export async function sendOfferOptimistically(draft: OfferDraft): Promise<Offer> {
  const { add, remove } = useOfferStore.getState();
  sequence += 1;
  const offer: Offer = {
    ...draft,
    id: `o-new-${sequence}`,
    fromUserId: CURRENT_USER_ID,
    state: 'pending',
    sentLabel: 'Just now',
  };
  add(offer);
  try {
    await persistOffer(offer.id, 'sent');
    return offer;
  } catch (error) {
    remove(offer.id);
    throw error;
  }
}

/**
 * Accepts, declines or withdraws an offer optimistically, putting it back as
 * it was if the server refuses.
 */
export async function setOfferStateOptimistically(
  offerId: string,
  next: OfferState,
): Promise<void> {
  const { offers, setState } = useOfferStore.getState();
  const previous = offers.find((offer) => offer.id === offerId)?.state;
  if (!previous || previous === next) return;
  setState(offerId, next);
  try {
    await persistOffer(offerId, next);
  } catch (error) {
    setState(offerId, previous);
    throw error;
  }
}

/** Offers still standing: withdrawn ones are as if never made. */
const stands = (offer: Offer) => offer.state !== 'withdrawn';

/** Offers on one listing, for its owner to review. Newest first. */
export function offersOn(offers: Offer[], listingId: string): Offer[] {
  return offers.filter((offer) => offer.listingId === listingId && stands(offer));
}

/** Offers the current user has made, whatever became of them. */
export function offersMadeBy(offers: Offer[], userId: string): Offer[] {
  return offers.filter((offer) => offer.fromUserId === userId);
}

/** A user's standing offer on a listing, if they have made one. */
export function myOfferOn(
  offers: Offer[],
  listingId: string,
  userId: string | undefined,
): Offer | undefined {
  if (!userId) return undefined;
  return offers.find(
    (offer) =>
      offer.listingId === listingId &&
      offer.fromUserId === userId &&
      stands(offer),
  );
}

/**
 * A listing's public offer count: what it arrived with, plus offers made
 * since, less sample ones withdrawn.
 */
export function offerCountFor(
  offers: Offer[],
  listingId: string,
  base: number,
): number {
  const here = offers.filter((offer) => offer.listingId === listingId);
  const added = here.filter((offer) => !offer.counted && stands(offer)).length;
  const gone = here.filter((offer) => offer.counted && !stands(offer)).length;
  return Math.max(0, base + added - gone);
}
