/**
 * Loading: Revenue, in the page's own shape: the row of controls, the four
 * tiles, the two chart cards, the products table and the payments table.
 * The page shows it too until the period has come.
 */

import { Bone } from '@snt/ui';
import { PagerSkeleton } from '../Pager';
import { StaffPage } from '../StaffPage';
import styles from './page.module.css';

export default function Loading() {
  return (
    <StaffPage
      title="Revenue"
      meta="Store passes and boosts, a day, a week, a month or a year at a time"
      actions={
        <div className={styles.controls}>
          <Bone shape="pill" width={260} height={36} />
          <Bone shape="pill" width={200} height={36} />
          <Bone shape="pill" width={90} height={36} />
          <Bone shape="pill" width={200} height={36} />
          <Bone shape="pill" width={180} height={36} />
        </div>
      }
    >
      <div className={styles.tiles}>
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={styles.tile}>
            <Bone width={90} height={12} />
            <Bone width={70} height={26} />
            <Bone width={120} height={11} />
          </div>
        ))}
      </div>
      {[0, 1].map((n) => (
        <section key={n} className={styles.card}>
          <div className={styles.cardHead}>
            <Bone width={170} height={16} />
            <Bone shape="pill" width={130} height={36} />
          </div>
          <Bone shape="block" height={240} />
        </section>
      ))}
      <div className={styles.list}>
        <div className={[styles.headerRow, styles.productRow].join(' ')} aria-hidden>
          <span>Product</span>
          <span>Sold</span>
          <span />
          <span />
        </div>
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={[styles.row, styles.productRow].join(' ')}>
            <Bone width={140} height={12} />
            <Bone width={24} height={12} />
            <Bone width={50} height={12} />
            <Bone width={50} height={12} />
          </div>
        ))}
      </div>
      <div className={styles.paymentsHead}>
        <Bone width={160} height={16} />
        <Bone shape="pill" width={200} height={36} />
      </div>
      <div className={styles.list}>
        {Array.from({ length: 4 }, (_, n) => (
          <div key={n} className={[styles.row, styles.paymentRow].join(' ')}>
            <span className={styles.when}>
              <Bone width={80} height={12} />
            </span>
            <span className={styles.payer}>
              <Bone width="60%" height={12} />
            </span>
            <span className={styles.store}>
              <Bone width="60%" height={12} />
            </span>
            <span className={styles.product}>
              <Bone width="70%" height={12} />
            </span>
            <span className={styles.amount}>
              <Bone width={40} height={12} />
            </span>
            <span className={styles.status}>
              <Bone width={60} height={20} shape="pill" />
            </span>
          </div>
        ))}
      </div>
      <PagerSkeleton />
    </StaffPage>
  );
}
