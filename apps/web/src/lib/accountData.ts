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
import { apiAsViewer } from './supabase';

connectOfferApi({
  async send(draft) {
    const { data, error } = await apiAsViewer<Offer>('/offers', { method: 'POST', body: draft });
    if (error || !data) throw new Error(error ?? 'We could not send it.');
    return data;
  },
  async change(offerId, state) {
    const { error } = await apiAsViewer(`/offers/${encodeURIComponent(offerId)}`, {
      method: 'PATCH',
      body: { state },
    });
    if (error) throw new Error(error);
  },
});

connectDealApi({
  async answer(dealId, answer) {
    const { data, error } = await apiAsViewer<{ deal: DealConfirmation; confirmedDeals: number }>(
      `/deals/${encodeURIComponent(dealId)}`,
      { method: 'PATCH', body: { answer } },
    );
    if (error || !data) throw new Error(error ?? 'We could not save it.');
    return data;
  },
});

connectSavedApi(async (listingId, saved) => {
  const { error } = await apiAsViewer(`/me/saved/${encodeURIComponent(listingId)}`, {
    method: saved ? 'PUT' : 'DELETE',
  });
  if (error) throw new Error(error);
});

connectNotificationApi(async (ids) => {
  await apiAsViewer('/me/notifications/read', { method: 'POST', body: { ids } });
});

connectSponsorApi({
  async buy(listingId, dailyBudget, days) {
    const { data, error } = await apiAsViewer<Sponsorship>(
      `/listings/${encodeURIComponent(listingId)}/boosts`,
      { method: 'POST', body: { dailyBudget, days } },
    );
    if (error || !data) throw new Error(error ?? 'We could not boost it.');
    return data;
  },
  async stop(listingId) {
    const { error } = await apiAsViewer(`/listings/${encodeURIComponent(listingId)}/boosts/stop`, {
      method: 'POST',
    });
    if (error) throw new Error(error);
  },
  async restore(listingId) {
    const { data, error } = await apiAsViewer<Sponsorship>(
      `/listings/${encodeURIComponent(listingId)}/boosts/restore`,
      { method: 'POST' },
    );
    if (error || !data) throw new Error(error ?? 'We could not put it back.');
    return data;
  },
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
  if (boosts.data) useSponsorStore.setState({ sponsorships: boosts.data.boosts, stopped: [] });
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
