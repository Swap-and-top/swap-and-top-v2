'use client';

/**
 * Loading: Offers. The heading and its two tabs are the page's own; then
 * each listing in brief and its offers on their rail, in bones.
 */

import {
  AppHeader,
  Bone,
  OfferCardSkeleton,
  Screen,
  ScreenBody,
  SignInGate,
  Tabs,
} from '@snt/ui';
import styles from './page.module.css';
import groups from '@/components/offers/OfferGroups.module.css';

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
        <SignInGate>
          <div className={groups.groups} aria-busy aria-label="Loading offers">
            {[1, 2].map((offers, g) => (
              <section key={g} className={groups.group}>
                <div className={groups.summary}>
                  <div className={groups.summaryMain}>
                    <Bone width={72} height={72} />
                    <div className={groups.summaryText}>
                      <Bone width={110} height={20} />
                      <Bone width={200} height={15} />
                      <Bone width={150} height={12} />
                      <Bone width={130} height={10} />
                    </div>
                  </div>
                  <Bone shape="pill" width={150} height={36} className={groups.see} />
                </div>
                <div className={groups.offersHead}>
                  <Bone width={130} height={13} />
                </div>
                <div className={groups.offers}>
                  {Array.from({ length: offers }).map((_, i) => (
                    <OfferCardSkeleton key={i} messageLines={2} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </SignInGate>
      </ScreenBody>

    </Screen>
  );
}
