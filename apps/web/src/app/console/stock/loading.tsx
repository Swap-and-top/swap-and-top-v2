/**
 * Loading: Stock. Built from the page's own styles, so every shape sits
 * where the real one will: the tabs, the toolbar, the count line, the
 * table's blue heading band (real, since it never changes), and a row of
 * bones for each item. The page shows it too until its stock has come, so
 * everything changes to the real page at once.
 */

import { currentStore } from '@snt/core';
import { Bone, ConsoleShell } from '@snt/ui';
import styles from './page.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      store={currentStore}
      title="Stock"
      actions={
        <>
        {/* Stock and Boosted, the tabs over the toolbar. */}
        <div className={styles.tabs}>
          <Bone shape="pill" width={176} height={40} />
        </div>
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
        </>
      }
    >
      <p className={styles.summary}>
        <Bone width={220} height={12} />
      </p>
      <div className={styles.list} aria-busy aria-label="Loading your stock">
        <div className={styles.headerRow} aria-hidden>
          <span />
          <span>Item</span>
          <span>Specs</span>
          <span>Price</span>
          <span>Status</span>
          <span className={styles.alignRight}>In stock</span>
          <span className={styles.alignRight}>Views</span>
          <span className={styles.alignRight}>Reveals</span>
          <span />
        </div>

        <StockBoneRows />
      </div>

      <div className={styles.addBar}>
        <Bone shape="pill" height={48} />
      </div>
    </ConsoleShell>
  );
}

/** A row of bones for each item, in the table's own shape: the loading
    screen's, and the page's while its stock comes. */
export function StockBoneRows() {
  return (
    <>
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
        <span className={styles.inStock}>
          <Bone width={20} height={13} />
        </span>
        <span className={styles.views}>
          <Bone width={30} height={13} />
        </span>
        <span className={styles.reveals}>
          <Bone width={64} height={13} />
        </span>
      </span>
      <span className={styles.action}>
        <Bone width={6} height={20} />
      </span>
    </div>
  ))}
    </>
  );
}
