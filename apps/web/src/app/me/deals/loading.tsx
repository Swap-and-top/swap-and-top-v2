'use client';

/**
 * Loading: Deals to confirm. The heading and its two tabs are the page's
 * own; then each deal's card in bones.
 */

import {
  AppHeader,
  Bone,
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
        <h1 className={styles.title}>Deals to confirm</h1>
        <Tabs
          fill
          tabs={[
            { value: 'waiting', label: 'To confirm' },
            { value: 'answered', label: 'Answered' },
          ]}
          active="waiting"
          onChange={() => {}}
          label="Deals to confirm or answered"
        />
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          <div className={styles.list} aria-busy aria-label="Loading deals">
            {[1, 2, 3].map((n) => (
              <div key={n} className={styles.card}>
                <div className={styles.main}>
                  <Bone width={72} height={72} />
                  <div className={styles.text}>
                    <Bone width={160} height={20} />
                    <Bone width={200} height={15} />
                    <Bone width={80} height={12} />
                    <Bone width={170} height={10} />
                  </div>
                </div>
                <Bone shape="pill" width={160} height={36} className={styles.open} />
              </div>
            ))}
          </div>
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
