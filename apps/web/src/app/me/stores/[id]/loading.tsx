/**
 * Loading: a store's own page, its own, so My stores' skeleton does not
 * show while it comes. The same parts as the page: the line about the
 * store, Get a store pass, Add a listing, Share and View as buyer, Edit
 * store details, the listings' heading and
 * its listings.
 */

import { FREE_STORE_LIMIT } from '@snt/core';
import { AppHeader, Bone, Screen, ScreenBody, Stack, SwapCardSkeleton, WantedCardSkeleton } from '@snt/ui';
import listStyles from '../../listings/page.module.css';
import styles from '../page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader>
        <Bone width={200} height={26} />
      </AppHeader>
      <ScreenBody>
        <Stack gap={6}>
          {/* The line about the store, unseen, under a bone the same size:
              one line or two, as the real one wraps at this width. */}
          <div className={styles.boneLead}>
            <p className={styles.lead} aria-hidden>
              A free store: up to {FREE_STORE_LIMIT} listings live. A store pass opens the Store console and lifts the
              limit.
            </p>
            <Bone height="" className={styles.boneLeadFill} />
          </div>
          <div className={styles.actions}>
            <Bone shape="pill" height="" className={styles.boneButton} />
            <Bone shape="pill" height="" className={styles.boneButton} />
          </div>
          <div className={styles.actions}>
            <Bone shape="pill" height="" className={styles.boneButton} />
            <Bone shape="pill" height="" className={styles.boneButton} />
          </div>
          <Bone shape="pill" height="" className={styles.boneButton} />
          <Bone width={140} height={12} />
          <div className={listStyles.list}>
            <WantedCardSkeleton />
            <SwapCardSkeleton />
          </div>
        </Stack>
      </ScreenBody>
    </Screen>
  );
}
