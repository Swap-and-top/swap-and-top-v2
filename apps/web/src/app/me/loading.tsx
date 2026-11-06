'use client';

/**
 * Loading: the account page. Its sections and rows never change, so they are
 * the page's own (their numbers come with the page); only the profile card,
 * with the name and the three numbers, waits in bones. The page shows it
 * too until its name, listings and account data have all come, and while
 * the browser looks for a sign in (no gate here: the page has it, and moves
 * a guest on).
 */

import {
  AppHeader,
  Footer,
  Bone,
  ListGroup,
  ListRow,
  Panel,
  Screen,
  ScreenBody,
  Stack,
  StatStripSkeleton,
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
  TeamIcon,
} from '@snt/ui/icons';
import { useSyncExternalStore } from 'react';
import { useSessionStore } from '@snt/core';
import { DevTools } from '@/components/DevTools';
import { useOnTeam } from '@/lib/staff';
import styles from './page.module.css';

/** Where this browser keeps whether they were on our team last time, so
    the skeleton has the team's row before the app knows who they are. */
export const ON_TEAM = 'snt-me-on-team';

function useRememberedOnTeam(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(ON_TEAM) === '1';
      } catch {
        return false;
      }
    },
    () => false,
  );
}

export default function Loading() {
  const known = useSessionStore((state) => state.viewer !== null);
  const teamNow = useOnTeam();
  const remembered = useRememberedOnTeam();
  const onTeam = known ? teamNow : remembered;
  return (
    <Screen>
      <AppHeader />

      <ScreenBody>
        <Stack gap={6}>
          <Panel padded>
            <div className={styles.head}>
              <Bone shape="circle" width={52} height={52} />
              <div className={styles.headBody}>
                <Bone width={130} height={22} />
                <Bone width={150} height={18} style={{ marginTop: 6 }} />
              </div>
            </div>
            <StatStripSkeleton
              className={styles.stats}
              labels={['listings', 'number reveals', 'deals confirmed']}
            />
          </Panel>

          <h2 className={styles.section}>Your activity</h2>
          <ListGroup>
            <ListRow href="/me/listings" icon={<ListIcon size={19} />} label="My listings" />
            <ListRow href="/me/deals" icon={<CheckIcon size={19} weight={1.9} />} label="Deals to confirm" />
            <ListRow href="/me/offers" icon={<SwapIcon size={19} />} label="Offers" />
            <ListRow href="/saved" icon={<SaveStarIcon size={19} />} label="Saved" />
          </ListGroup>

          <h2 className={styles.section}>For stores</h2>
          <ListGroup>
            <ListRow href="/me/stores" icon={<BoxIcon size={19} />} label="My stores" />
          </ListGroup>

          {/* Our own team's row, for them, as the page has it. */}
          {onTeam ? (
            <>
              <h2 className={styles.section}>For our team</h2>
              <ListGroup>
                <ListRow href="/me" icon={<TeamIcon size={19} />} label="Staff console" />
              </ListGroup>
            </>
          ) : null}

          <h2 className={styles.section}>Account</h2>
          <ListGroup>
            <ListRow href="/me" icon={<ShieldCheckIcon size={19} />} label="Verification" />
            <ListRow href="/me" icon={<InfoIcon size={19} />} label="Safety tips" />
            <ListRow href="/me" icon={<SettingsIcon size={19} />} label="Settings" />
          </ListGroup>

          <DevTools headingClassName={styles.section} />

          <Stack gap={4}>
            <Bone shape="pill" height={44} />
            <Bone shape="pill" height={44} />
          </Stack>
        </Stack>
      </ScreenBody>
      <Footer />
    </Screen>
  );
}
