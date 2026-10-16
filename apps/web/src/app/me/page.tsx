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

import {
  currentUser,
  mockDealConfirmations,
  pendingConfirmationCount,
  useDealStore,
  useSavedStore,
  getListing,
  mockListings,
  useOfferStore,
  useSessionStore,
} from '@snt/core';
import {
  Button,
  AppHeader,
  Avatar,
  BottomNav,
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
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SwapIcon,
} from '@snt/ui/icons';
import styles from './page.module.css';

export default function MePage() {
  const { ids } = useSavedStore();
  const { confirmedDeals } = useDealStore();
  const signOut = useSessionStore((state) => state.signOut);
  const offers = useOfferStore((store) => store.offers);
  /** Offers made, plus those waiting on the user's own listings. */
  const offerTotal = offers.filter(
    (offer) =>
      offer.state !== 'withdrawn' &&
      (offer.fromUserId === currentUser.id ||
        getListing(offer.listingId)?.ownerId === currentUser.id),
  ).length;

  /** What the user has posted, and how much of it is wanted posts. */
  const myListings = mockListings.filter(
    (listing) =>
      listing.ownerId === currentUser.id && listing.status !== 'removed',
  );
  const myWanted = myListings.filter((listing) => listing.type === 'request');

  /** The first pending confirmation is what the badge links to. */
  const pending = mockDealConfirmations.find(
    (item) => item.state === 'pending' && item.buyerAnswer === 'unanswered',
  );

  return (
    <Screen>
      <AppHeader />

      <ScreenBody>
        <SignInGate
          title="Your account"
          body="Sign in to post, save listings, and send and receive offers."
          reason="Sign in to open your account."
        >
          <Stack gap={6}>
            <Panel padded>
              <div className={styles.head}>
                <Avatar size={52} />
                <div className={styles.headBody}>
                  <div className={styles.name}>{currentUser.displayName}</div>
                  <div className={styles.trust}>
                    <ConfirmedDealsBadge count={confirmedDeals} size="md" long />
                  </div>
                </div>
              </div>

              <StatStrip
                className={styles.stats}
                stats={[
                  { value: myListings.length, label: 'listings' },
                  { value: 12, label: 'number reveals' },
                  {
                    value: confirmedDeals,
                    label: 'deals confirmed',
                    tone: 'trust',
                  },
                ]}
              />
            </Panel>

            <ListGroup>
              <ListRow
                href="/me/listings"
                icon={<ListIcon size={19} />}
                label="My listings"
                value={String(myListings.length)}
              />
              <ListRow
                href="/me/listings"
                icon={<SearchIcon size={19} />}
                label="My wanted posts"
                value={String(myWanted.length)}
              />
              <ListRow
                href={pending ? `/deals/${pending.id}/confirm` : '/me'}
                icon={<CheckIcon size={19} weight={1.9} />}
                label="Deals to confirm"
                badge={<CountBadge count={pendingConfirmationCount} />}
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
                label="Wishlist"
                value={String(ids.length)}
              />
            </ListGroup>

            {/* Visible only to dealer accounts in the real app. */}
            <ConsoleEntryRow
              href="/console/stock"
              icon={<BoxIcon size={20} />}
              title="Switch to dealer console"
              subtitle="Stock, leads and promotion"
            />

            <ListGroup>
              <ListRow
                href="/me"
                icon={<ShieldCheckIcon size={19} />}
                label="Verification"
                value="Phone verified"
              />
              <ListRow
                href="/me"
                icon={<InfoIcon size={19} />}
                label="Safety and how to swap"
              />
              <ListRow
                href="/me"
                icon={<SettingsIcon size={19} />}
                label="Settings"
              />
            </ListGroup>

            {/* Back to browsing as a guest. */}
            <Button variant="secondary" block onClick={signOut}>
              Sign out
            </Button>
          </Stack>
        </SignInGate>
      </ScreenBody>

      <BottomNav />
    </Screen>
  );
}
