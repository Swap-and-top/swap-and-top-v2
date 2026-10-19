/**
 * Loading: Stock. Built from the page's own styles, so every shape sits
 * where the real one will: the toolbar, the table's blue heading band (real,
 * since it never changes), and a row of bones for each item.
 */

import { currentShop, newLeadCount } from '@snt/core';
import { Bone, ConsoleShell } from '@snt/ui';
import styles from './page.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Stock"
      meta={<Bone width={200} height={11} />}
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.toolbar}>
          <Bone shape="pill" width="auto" height={40} className={styles.search} />
          <div className={styles.toolbarActions}>
            <Bone shape="pill" width={104} height={36} />
            <Bone shape="pill" width={120} height={36} />
            <Bone
              shape="pill"
              width={124}
              height={36}
              className={styles.wideOnly}
            />
          </div>
        </div>
      }
    >
      <div className={styles.list} aria-busy aria-label="Loading your stock">
        <div className={styles.headerRow} aria-hidden>
          <span />
          <span>Item</span>
          <span>Specs</span>
          <span>Price</span>
          <span>Status</span>
          <span className={styles.alignRight}>Views</span>
          <span className={styles.alignRight}>Reveals</span>
          <span />
        </div>

        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.row}>
            <Bone shape="block" width={44} height={44} className={styles.thumb} />
            <span className={styles.title}>
              <Bone width={[150, 120, 170][i % 3]} height={14} />
            </span>
            <span className={styles.specs}>
              <Bone width={130} height={11} />
              <Bone width={90} height={11} style={{ marginTop: 6 }} />
            </span>
            <span className={styles.meta}>
              <Bone width={48} height={16} />
              <Bone shape="pill" width={56} height={22} />
              <span className={styles.views}>
                <Bone width={30} height={13} />
              </span>
              <span className={styles.reveals}>
                <Bone width={64} height={13} />
              </span>
            </span>
            <span className={styles.action}>
              <Bone shape="pill" width={64} height={36} />
            </span>
          </div>
        ))}
      </div>

      <div className={styles.addBar}>
        <Bone shape="pill" height={48} />
      </div>
    </ConsoleShell>
  );
}
