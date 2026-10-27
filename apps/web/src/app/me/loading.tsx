'use client';

/**
 * Loading: the account page. Its sections and rows never change, so they are
 * the page's own (their numbers come with the page); only the profile card,
 * with the name and the three numbers, waits in bones.
 */

import {
  AppHeader,
  Footer,
  Bone,
  ConsoleEntryRow,
  ListGroup,
  ListRow,
  Panel,
  Screen,
  ScreenBody,
  SignInGate,
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
} from '@snt/ui/icons';
import { DevTools } from '@/components/DevTools';
import styles from './page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader />

      <ScreenBody>
        <SignInGate>
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
            <ConsoleEntryRow
              href="/console/stock"
              icon={<BoxIcon size={20} />}
              title="Switch to Store console"
              subtitle="Stock, leads and promotion"
            />

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
        </SignInGate>
      </ScreenBody>
      <Footer />
    </Screen>
  );
}
