'use client';

/**
 * What belongs to the signed in person, loaded from the API once they are in
 * and cleared when they sign out: their offers (made and received), the deal
 * checks they are asked about, their saved listings and their notifications.
 * The stores' server calls are connected here too.
 */

import {
  connectDealApi,
  connectNotificationApi,
  connectOfferApi,
  connectSavedApi,
  connectSponsorApi,
  useDealStore,
  useNotificationStore,
  useOfferStore,
  useSavedStore,
  useSponsorStore,
  type AppNotification,
  type DealConfirmation,
  type Offer,
  type Sponsorship,
} from '@snt/core';
import { apiSend, refreshAccount, runMutation } from './query';
import { apiAsViewer } from './supabase';

/**
 * The shared stores' server calls. Each store shows its change at once and
 * puts it back if the call fails; the call itself is a TanStack Query
 * mutation (`runMutation`), and once saved what is theirs is read again
 * (`refreshAccount`), so every screen agrees with the server.
 */
const saved = <T>(call: () => Promise<T>): Promise<T> =>
  runMutation(call).then((result) => {
    refreshAccount();
    return result;
  });

connectOfferApi({
  send: (draft) => saved(() => apiSend<Offer>('/offers', 'POST', draft)),
  change: (offerId, state) =>
    saved(() => apiSend<Offer>(`/offers/${encodeURIComponent(offerId)}`, 'PATCH', { state })),
});

connectDealApi({
  answer: (dealId, answer) =>
    saved(() =>
      apiSend<{ deal: DealConfirmation; confirmedDeals: number }>(
        `/deals/${encodeURIComponent(dealId)}`,
        'PATCH',
        { answer },
      ),
    ),
});

connectSavedApi((listingId, keep) =>
  saved(() => apiSend(`/me/saved/${encodeURIComponent(listingId)}`, keep ? 'PUT' : 'DELETE')).then(
    () => undefined,
  ),
);

connectNotificationApi((ids) =>
  saved(() => apiSend('/me/notifications/read', 'POST', { ids })).then(() => undefined),
);

// Boosts come back from the API as saved, so the store keeps them as they
// are; their listings' Sponsored labels follow the store.
connectSponsorApi({
  buy: (listingId, dailyBudget, days) =>
    saved(() =>
      apiSend<Sponsorship>(`/listings/${encodeURIComponent(listingId)}/boosts`, 'POST', { dailyBudget, days }),
    ),
  stop: (listingId) =>
    saved(() => apiSend(`/listings/${encodeURIComponent(listingId)}/boosts/stop`, 'POST')).then(
      () => undefined,
    ),
  restore: (listingId) =>
    saved(() => apiSend<Sponsorship>(`/listings/${encodeURIComponent(listingId)}/boosts/restore`, 'POST')),
});

export async function loadAccountData() {
  const [offers, deals, saved, notifications, boosts] = await Promise.all([
    apiAsViewer<{ offers: Offer[] }>('/me/offers', { method: 'GET' }),
    apiAsViewer<{ deals: DealConfirmation[]; confirmedDeals: number }>('/me/deals', {
      method: 'GET',
    }),
    apiAsViewer<{ ids: string[] }>('/me/saved', { method: 'GET' }),
    apiAsViewer<{ notifications: AppNotification[] }>('/me/notifications', { method: 'GET' }),
    apiAsViewer<{ boosts: Sponsorship[] }>('/me/boosts', { method: 'GET' }),
  ]);
  // Boosts stopped here stay marked stopped (cleared on sign out), so their
  // listings do not show Sponsored again from a page loaded before.
  if (boosts.data) useSponsorStore.setState({ sponsorships: boosts.data.boosts });
  if (offers.data) useOfferStore.setState({ offers: offers.data.offers });
  if (saved.data) useSavedStore.setState({ ids: saved.data.ids });
  if (notifications.data) {
    useNotificationStore.setState({ notifications: notifications.data.notifications, readIds: [] });
  }
  if (deals.data) {
    useDealStore.setState({
      deals: deals.data.deals,
      confirmedDeals: deals.data.confirmedDeals,
      loaded: true,
    });
  }
}

export function clearAccountData() {
  useOfferStore.setState({ offers: [] });
  useSavedStore.setState({ ids: [] });
  useNotificationStore.setState({ notifications: [], readIds: [] });
  useDealStore.setState({ deals: [], answers: {}, confirmedDeals: 0, loaded: false });
  useSponsorStore.setState({ sponsorships: [], stopped: [] });
}
