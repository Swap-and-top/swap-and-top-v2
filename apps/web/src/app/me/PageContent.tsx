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
  confirmationsAwaiting,
  useDealStore,
  useSavedStore,
  getListing,
  statusOf,
  viewerName,
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
import { useOnTeam } from '@/lib/staff';
import { useMyListings } from '@/lib/myListings';
import { useStaffHome } from '../staff/sections';
import styles from './page.module.css';

/** One empty list, so a guest's stores are the same each time they are read. */
const NO_STORES: never[] = [];

export default function MePage() {
  const { ids } = useSavedStore();
  const { answers, confirmedDeals, deals } = useDealStore();
  const signOut = useSessionStore((state) => state.signOut);
  // Who is signed in: their name and id, never the sample account's.
  const viewer = useSessionStore((state) => state.viewer);
  const me = viewer?.id;
  const name = viewer ? viewerName(viewer) : '';
  const onTeam = useOnTeam();
  /** The console's first section for them, linked straight to. */
  const staffHome = useStaffHome();
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
  const posted = useMyListings(me) ?? [];
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

            {/* Their stores as one row with the count, opening the list of
                them, each into its Store console (where its details and pass
                are); or, without one, the way to open one. */}
            <h2 className={styles.section}>For stores</h2>
            <ListGroup>
              {stores.length ? (
                <ListRow
                  href="/me/stores"
                  icon={<BoxIcon size={19} />}
                  label="My stores"
                  value={String(stores.length)}
                />
              ) : (
                <ListRow href="/store/new" icon={<BoxIcon size={19} />} label="Open a store" value="Free" />
              )}
            </ListGroup>

            {/* Our own team: the Staff console, showing the sections of
                their departments. */}
            {onTeam ? (
              <>
                <h2 className={styles.section}>For our team</h2>
                <ListGroup>
                  <ListRow
                    href={staffHome}
                    icon={<ShieldCheckIcon size={19} />}
                    label="Staff console"
                  />
                </ListGroup>
              </>
            ) : null}

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
