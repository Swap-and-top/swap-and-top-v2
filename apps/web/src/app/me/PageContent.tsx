'use client';

/**
 * Account hub.
 *
 * The trust line under the name is the confirmed-deal count. There is no badge
 * for who someone is or what they do — see docs/product/trust-and-safety.md for
 * why the student badge was removed.
 *
 * Wireframe artboard: `Me`.
 */

import { useEffect, useState } from 'react';
import {
  confirmationsAwaiting,
  useDealStore,
  useSavedStore,
  getListing,
  statusOf,
  viewerName,
  useListingStatusStore,
  useOfferStore,
  useSessionStore,
  type Listing,
} from '@snt/core';
import {
  Button,
  ButtonLink,
  AppHeader,
  Footer,
  Avatar,
  ConfirmedDealsBadge,
  ConsoleEntryRow,
  CountBadge,
  ListGroup,
  ListRow,
  Panel,
  Screen,
  ScreenBody,
  Stack,
  StatStrip,
  SignInGate,
} from '@snt/ui';
import {
  BoxIcon,
  CheckIcon,
  InfoIcon,
  ListIcon,
  SaveStarIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SwapIcon,
} from '@snt/ui/icons';
import { DevTools } from '@/components/DevTools';
import { StorePassSheet, type PassStore } from '@/components/StorePassSheet';
import { apiAsViewer } from '@/lib/supabase';
import styles from './page.module.css';

/** One empty list, so a guest's stores are the same each time they are read. */
const NO_STORES: never[] = [];

export default function MePage() {
  /** The store whose pass sheet is open, if any. */
  const [passFor, setPassFor] = useState<PassStore | null>(null);
  const { ids } = useSavedStore();
  const { answers, confirmedDeals, deals } = useDealStore();
  const signOut = useSessionStore((state) => state.signOut);
  // Who is signed in: their name and id, never the sample account's.
  const viewer = useSessionStore((state) => state.viewer);
  const me = viewer?.id;
  const name = viewer ? viewerName(viewer) : '';
  const phoneVerified = useSessionStore((state) => state.viewer?.phoneVerified ?? false);
  const stores = useSessionStore((state) => state.viewer?.stores ?? NO_STORES);
  const offers = useOfferStore((store) => store.offers);
  /** Offers made, plus those waiting on the user's own listings. */
  const offerTotal = offers.filter(
    (offer) =>
      offer.state !== 'withdrawn' &&
      (offer.fromUserId === me || getListing(offer.listingId)?.ownerId === me),
  ).length;

  /** What the user has posted and still has up, from the API. */
  const changes = useListingStatusStore((state) => state.changes);
  const [posted, setPosted] = useState<Listing[]>([]);
  useEffect(() => {
    if (!me) return;
    let current = true;
    void apiAsViewer<{ listings: Listing[] }>('/me/listings', { method: 'GET' }).then(
      ({ data }) => {
        if (current) setPosted(data?.listings ?? []);
      },
    );
    return () => {
      current = false;
    };
  }, [me]);
  const myListings = posted.filter((listing) => {
    const status = statusOf(listing, changes);
    return status !== 'withdrawn' && status !== 'removed';
  });

  /** Deals still waiting on the user's answer. */
  const toConfirm = confirmationsAwaiting(deals, answers);

  return (
    <Screen>
      <AppHeader />

      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <Panel padded>
              <div className={styles.head}>
                {/* Their initials, as in the header's account circle. */}
                <Avatar size={52} initials={initialsOf(name)} />
                <div className={styles.headBody}>
                  <div className={styles.name}>{name}</div>
                  <div className={styles.trust}>
                    <ConfirmedDealsBadge count={confirmedDeals} size="md" long />
                  </div>
                </div>
              </div>

              <StatStrip
                className={styles.stats}
                stats={[
                  { value: myListings.length, label: 'listings' },
                  {
                    // Everyone who saw how to reach them, on their listings.
                    value: myListings.reduce((sum, l) => sum + (l.revealCount || 0), 0),
                    label: 'number reveals',
                  },
                  {
                    value: confirmedDeals,
                    label: 'deals confirmed',
                    tone: 'trust',
                  },
                ]}
              />
            </Panel>

            <h2 className={styles.section}>Your activity</h2>
            <ListGroup>
              <ListRow
                href="/me/listings"
                icon={<ListIcon size={19} />}
                label="My listings"
                value={String(myListings.length)}
              />
              <ListRow
                href="/me/deals"
                icon={<CheckIcon size={19} weight={1.9} />}
                label="Deals to confirm"
                badge={<CountBadge count={toConfirm} />}
              />
              <ListRow
                href="/me/offers"
                icon={<SwapIcon size={19} />}
                label="Offers"
                value={String(offerTotal)}
              />
              <ListRow
                href="/saved"
                icon={<SaveStarIcon size={19} />}
                label="Saved"
                value={String(ids.length)}
              />
            </ListGroup>

            {/* Their stores, and the console; or, without one, the way to
                open one. */}
            <h2 className={styles.section}>For stores</h2>
            {stores.length ? (
              <Stack gap={4}>
                {stores.map((store) => (
                  <Stack key={store.id} gap={4}>
                    <ConsoleEntryRow
                      href={`/store/${store.slug}`}
                      icon={<BoxIcon size={20} />}
                      title={store.name}
                      subtitle={
                        store.paidUntil
                          ? `Paid until ${store.paidUntil}`
                          : store.role === 'owner'
                            ? 'Free store, up to 15 listings'
                            : 'A store you work for'
                      }
                    />
                    {/* The owner buys its pass and edits its details; staff
                        cannot. */}
                    {store.role === 'owner' ? (
                      <>
                        <ButtonLink href={`/store/${store.slug}/edit`} variant="secondary" block>
                          Edit store details
                        </ButtonLink>
                        <Button variant="secondary" block onClick={() => setPassFor(store)}>
                          {store.paidUntil ? 'Extend store pass' : 'Get a store pass'}
                        </Button>
                      </>
                    ) : null}
                  </Stack>
                ))}
                <ConsoleEntryRow
                  href="/console/stock"
                  icon={<BoxIcon size={20} />}
                  title="Switch to Store console"
                  subtitle="Stock, leads and promotion"
                />
              </Stack>
            ) : (
              <ConsoleEntryRow
                href="/store/new"
                icon={<BoxIcon size={20} />}
                title="Open a store"
                subtitle="Your own page and up to 15 listings, free"
              />
            )}

            <h2 className={styles.section}>Account</h2>
            <ListGroup>
              <ListRow
                href="/me/settings"
                icon={<ShieldCheckIcon size={19} />}
                label="Verification"
                value={phoneVerified ? 'Phone verified' : 'Phone not verified'}
              />
              <ListRow
                href="/help"
                icon={<InfoIcon size={19} />}
                label="Safety tips"
              />
              <ListRow
                href="/me/settings"
                icon={<SettingsIcon size={19} />}
                label="Settings"
              />
            </ListGroup>

            {/* While developing: the reference pages and slow mode. */}
            <DevTools headingClassName={styles.section} />

            {/* Back to the feed, the usual way out; signing out, the rare one,
                under it. */}
            <Stack gap={4}>
              <ButtonLink href="/" block>
                Back to market
              </ButtonLink>
              <Button variant="secondary" block onClick={signOut}>
                Sign out
              </Button>
            </Stack>
          </Stack>
        </SignInGate>
      </ScreenBody>
      {passFor ? <StorePassSheet store={passFor} onClose={() => setPassFor(null)} /> : null}
      <Footer />
    </Screen>
  );
}

/** "Tarisai M." → "TM": at most two letters, as in the header. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
