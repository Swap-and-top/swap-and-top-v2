/**
 * Loading: Swap offers. Built from the page's own styles: a group per item,
 * its heading as a bar, then offer cards in bones.
 */

import { currentShop, newLeadCount } from '@snt/core';
import { Bone, ConsoleShell, OfferCardSkeleton } from '@snt/ui';
import styles from './page.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Swap offers"
      meta={<Bone width={220} height={11} />}
      newLeadCount={newLeadCount}
    >
      <div className={styles.groups} aria-busy aria-label="Loading swap offers">
        {[1].map((offers, g) => (
          <section key={g} className={styles.group}>
            <Bone width={180} height={13} />
            {Array.from({ length: offers }).map((_, i) => (
              <OfferCardSkeleton key={i} messageLines={2} />
            ))}
          </section>
        ))}
      </div>
    </ConsoleShell>
  );
}
