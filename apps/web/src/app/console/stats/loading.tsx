'use client';

/**
 * Loading: Stats. The title and the stretch of time are the page's own;
 * then the four numbers, the graph and the best items, in bones.
 */

import { currentShop, newLeadCount } from '@snt/core';
import { Bone, ConsoleShell, Tabs } from '@snt/ui';
import styles from './page.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Stats"
      meta="How your shop is doing, and ways to grow it"
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.range}>
          <Tabs
            fill
            tabs={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
              { value: 'all', label: 'All time', short: 'All' },
            ]}
            active="week"
            onChange={() => {}}
            label="Stretch of time"
          />
        </div>
      }
    >
      <div className={styles.tiles} aria-busy aria-label="Loading">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.tile}>
            <Bone width="60%" height={11} />
            <Bone width="45%" height={26} style={{ marginTop: 4 }} />
            <Bone width="80%" height={10} style={{ marginTop: 4 }} />
          </div>
        ))}
      </div>

      <section className={styles.card}>
        <Bone width="55%" height={16} />
        <Bone width="40%" height={12} style={{ marginTop: 10 }} />
        <Bone shape="block" height={170} style={{ marginTop: 16 }} />
      </section>

      <section className={styles.card}>
        <Bone width="35%" height={16} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ marginTop: 16 }}>
            <Bone width="50%" height={14} />
            <Bone width="75%" height={10} style={{ marginTop: 6 }} />
          </div>
        ))}
      </section>
    </ConsoleShell>
  );
}
