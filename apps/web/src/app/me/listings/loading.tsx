'use client';

/**
 * Loading: My listings. The heading is the page's own; the tabs, which carry
 * counts, as bars; then listing cards in bones, as the feed's.
 */

import {
  AppHeader,
  BottomNav,
  Screen,
  ScreenBody,
  SignInGate,
  SwapCardSkeleton,
  TabsSkeleton,
  WantedCardSkeleton,
} from '@snt/ui';
import styles from './page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>My listings</h1>
        <TabsSkeleton fill widths={[40, 76, 64]} />
      </AppHeader>

      <ScreenBody>
        <SignInGate
          title="Your listings"
          body="Sign in to see what you have posted."
          reason="Sign in to see your listings."
        >
          <div className={styles.list}>
            <WantedCardSkeleton />
            <SwapCardSkeleton />
          </div>
        </SignInGate>
      </ScreenBody>

      <BottomNav />
    </Screen>
  );
}
