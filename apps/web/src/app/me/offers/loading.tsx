'use client';

/**
 * Loading: Offers. The heading and its two tabs are the page's own; then a
 * listing's heading as a bar and its offers as cards in bones.
 */

import {
  AppHeader,
  BottomNav,
  Bone,
  OfferCardSkeleton,
  Screen,
  ScreenBody,
  SignInGate,
  Tabs,
} from '@snt/ui';
import styles from './page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>Offers</h1>
        <Tabs
          fill
          tabs={[
            { value: 'received', label: 'Received' },
            { value: 'made', label: 'Made' },
          ]}
          active="received"
          onChange={() => {}}
          label="Offers received or made"
        />
      </AppHeader>

      <ScreenBody>
        <SignInGate
          title="Your offers"
          body="Sign in to see offers on your listings, and the offers you have made."
          reason="Sign in to see your offers."
        >
          <div className={styles.groups} aria-busy aria-label="Loading offers">
            {[1, 2].map((offers, g) => (
              <section key={g} className={styles.group}>
                <Bone width={200} height={13} />
                {Array.from({ length: offers }).map((_, i) => (
                  <OfferCardSkeleton key={i} messageLines={2} />
                ))}
              </section>
            ))}
          </div>
        </SignInGate>
      </ScreenBody>

      <BottomNav />
    </Screen>
  );
}
