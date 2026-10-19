/**
 * Loading: Promote. Built from the page's own styles: the numbers strip with
 * its labels, the three product cards, and the best performer.
 */

import { currentShop, newLeadCount } from '@snt/core';
import { Bone, ConsoleShell, StatStripSkeleton } from '@snt/ui';
import styles from './page.module.css';
import skeleton from './loading.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Promote"
      newLeadCount={newLeadCount}
      actions={
        <StatStripSkeleton
          className={styles.stats}
          labels={['reveals, 7d', 'deals, 30d', 'sponsored lift']}
        />
      }
    >
      <div className={styles.cards} aria-busy aria-label="Loading">
        {[true, true, false].map((hasMeta, i) => (
          <div key={i} className={styles.card}>
            <Bone shape="block" width={34} height={34} />
            <div className={styles.body}>
              <Bone width="50%" height={26} />
              <Bone width="95%" height={11} style={{ marginTop: 14 }} />
              <Bone width="70%" height={11} style={{ marginTop: 10 }} />
              {/* Three cards side by side wrap their words more: the extra
                  lines only there. */}
              <Bone width="85%" height={11} style={{ marginTop: 8 }} className={skeleton.wideOnly} />
              <Bone width="50%" height={11} style={{ marginTop: 8 }} className={skeleton.wideOnly} />
              {i > 0 ? (
                <div className={styles.actions}>
                  <Bone shape="pill" width={130} height={36} />
                  {hasMeta ? <Bone width={60} height={11} /> : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.performer}>
        <Bone width={150} height={12} />
        <div className={styles.performerRow}>
          <Bone shape="block" width={44} height={44} />
          <div className={styles.performerBody}>
            <Bone width="50%" height={14} />
            <Bone width="30%" height={11} style={{ marginTop: 6 }} />
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
