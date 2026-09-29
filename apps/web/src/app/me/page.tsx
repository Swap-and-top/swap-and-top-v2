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
} from '@snt/core';
import {
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
} from '@snt/ui/icons';
import styles from './page.module.css';

export default function MePage() {
  const { ids } = useSavedStore();
  const { confirmedDeals } = useDealStore();

  /** The first pending confirmation is what the badge links to. */
  const pending = mockDealConfirmations.find(
    (item) => item.state === 'pending' && item.buyerAnswer === 'unanswered',
  );

  return (
    <Screen>
      <AppHeader />

      <ScreenBody>
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
                { value: 3, label: 'listings' },
                { value: 12, label: 'number reveals' },
                {
                  value: confirmedDeals,
                  label: 'deals confirmed',
                  tone: 'success',
                },
              ]}
            />
          </Panel>

          <ListGroup>
            <ListRow
              href="/"
              icon={<ListIcon size={19} />}
              label="My listings"
              value="3"
            />
            <ListRow
              href="/wanted"
              icon={<SearchIcon size={19} />}
              label="My wanted posts"
              value="1"
            />
            <ListRow
              href={pending ? `/deals/${pending.id}/confirm` : '/me'}
              icon={<CheckIcon size={19} weight={1.9} />}
              label="Deals to confirm"
              badge={<CountBadge count={pendingConfirmationCount} />}
            />
            <ListRow
              href="/saved"
              icon={<SaveStarIcon size={19} />}
              label="Saved"
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
        </Stack>
      </ScreenBody>

      <BottomNav pendingConfirmations={pendingConfirmationCount} />
    </Screen>
  );
}
