'use client';

/**
 * Loading: Offers. The title and its two tabs are the page's own; then a
 * listing in brief and its offers on their thread, in bones.
 */

import { currentShop, newLeadCount } from '@snt/core';
import { Bone, ConsoleShell, OfferCardSkeleton, Tabs } from '@snt/ui';
import groups from '@/components/offers/OfferGroups.module.css';
import styles from './page.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Offers"
      meta={<Bone width={140} height={11} />}
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.tabs}>
          <Tabs
            fill
            tabs={[
              { value: 'received', label: 'Received' },
              { value: 'sent', label: 'Sent' },
            ]}
            active="received"
            onChange={() => {}}
            label="Offers received or sent"
          />
        </div>
      }
    >
      <div className={styles.column}>
        <div className={groups.groups} aria-busy aria-label="Loading offers">
          <section className={groups.group}>
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
              <OfferCardSkeleton messageLines={2} />
            </div>
          </section>
        </div>
      </div>
    </ConsoleShell>
  );
}
