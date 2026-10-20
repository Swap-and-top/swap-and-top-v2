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
  statusOf,
  useListingStatusStore,
  useOfferStore,
  useSessionStore,
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
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SwapIcon,
} from '@snt/ui/icons';
import { DevTools } from '@/components/DevTools';
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
  const changes = useListingStatusStore((state) => state.changes);
  const myListings = mockListings.filter((listing) => {
    if (listing.ownerId !== currentUser.id) return false;
    const status = statusOf(listing, changes);
    return status !== 'withdrawn' && status !== 'removed';
  });
  const myWanted = myListings.filter((listing) => listing.type === 'request');

  /** The first pending confirmation is what the badge links to. */
  const pending = mockDealConfirmations.find(
    (item) => item.state === 'pending' && item.buyerAnswer === 'unanswered',
  );

  return (
    <Screen>
      <AppHeader />

      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <Panel padded>
              <div className={styles.head}>
                {/* Their initials, as in the header's account circle. */}
                <Avatar size={52} initials={initialsOf(currentUser.displayName)} />
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

            <h2 className={styles.section}>Your activity</h2>
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
                label="Saved"
                value={String(ids.length)}
              />
            </ListGroup>

            {/* Visible only to dealer accounts in the real app. */}
            <h2 className={styles.section}>For dealers</h2>
            <ConsoleEntryRow
              href="/console/stock"
              icon={<BoxIcon size={20} />}
              title="Switch to dealer console"
              subtitle="Stock, leads and promotion"
            />

            <h2 className={styles.section}>Account</h2>
            <ListGroup>
              <ListRow
                href="/me"
                icon={<ShieldCheckIcon size={19} />}
                label="Verification"
                value="Phone verified"
              />
              <ListRow
                href="/help"
                icon={<InfoIcon size={19} />}
                label="Safety tips"
              />
              <ListRow
                href="/me"
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
