/**
 * Loading: Stores, in the page's own shape: the two tabs, the search box and
 * the filter, the count line, the table under its heading strip, and the
 * page buttons. The page shows it too until its rows have come.
 */

import { Bone } from '@snt/ui';
import { PagerSkeleton } from '../Pager';
import { StaffPage } from '../StaffPage';
import styles from './page.module.css';

export default function Loading() {
  return (
    <StaffPage
      title="Stores"
      meta="Every store, and who to call, the fullest first"
      actions={
        <>
          <div className={styles.tabs}>
            <Bone shape="pill" width={300} height={40} />
          </div>
          <div className={styles.toolbar}>
            <Bone shape="pill" width="auto" height={36} className={styles.search} />
            <Bone shape="pill" width={240} height={36} />
          </div>
        </>
      }
    >
      <p className={styles.summary}>
        <Bone width={90} height={12} />
      </p>
      <div className={styles.list} aria-busy aria-label="Loading stores">
        <div className={styles.headerRow} aria-hidden>
          <span />
          <span>Store</span>
          <span>Owner</span>
          <span>Area</span>
          <span>Listings</span>
          <span>Pass</span>
          <span />
        </div>
        {Array.from({ length: 10 }, (_, n) => (
          <div key={n} className={styles.row} aria-hidden>
            <Bone width={32} height={32} shape="circle" />
            <span className={styles.head}>
              <Bone width="70%" height={12} />
            </span>
            <span className={styles.owner}>
              <Bone width="60%" height={12} />
            </span>
            <span className={styles.area}>
              <Bone width="60%" height={12} />
            </span>
            <span className={styles.live}>
              <Bone width={40} height={12} />
            </span>
            <span className={styles.pass}>
              <Bone width={80} height={20} shape="pill" />
            </span>
            <span className={styles.call}>
              <Bone width={104} height={26} shape="pill" />
            </span>
          </div>
        ))}
      </div>
      <PagerSkeleton />
    </StaffPage>
  );
}
