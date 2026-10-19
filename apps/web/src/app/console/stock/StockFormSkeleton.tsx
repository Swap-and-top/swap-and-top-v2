/**
 * The stock form while it loads, built from its own styles (see StockForm):
 * the category chips, the photo squares, the boxes two to a row, the tick,
 * and the buttons at the foot. Used by Add stock, Edit and Finish.
 */

import { Bone, ConsoleShell } from '@snt/ui';
import { currentShop, newLeadCount } from '@snt/core';
import styles from './StockForm.module.css';

/** A labelled box: its label bar set in over a pale pill. */
function FieldBones({ wide = false }: { wide?: boolean }) {
  return (
    <div className={[styles.field, wide ? styles.wide : ''].join(' ')}>
      <Bone width={80} height={12} style={{ marginLeft: 20, marginBottom: 6 }} />
      <Bone shape="pill" height={48} />
    </div>
  );
}

export function StockFormSkeleton({
  title,
  meta,
  editing = false,
}: {
  title: string;
  meta: string;
  /** Edit: a status row at the top, and Cancel beside Save. */
  editing?: boolean;
}) {
  return (
    <ConsoleShell
      shop={currentShop}
      title={title}
      meta={meta}
      newLeadCount={newLeadCount}
    >
      <div className={styles.form} aria-busy aria-label="Loading">
        {editing ? (
          <div className={styles.standing}>
            <Bone width={100} height={12} />
            <div className={styles.standingChoices}>
              <Bone shape="pill" width={60} height={34} />
              <Bone shape="pill" width={76} height={34} />
            </div>
          </div>
        ) : null}

        <div className={styles.group}>
          <Bone width={70} height={12} />
          {/* One row, cut at the card's edge, as the real chips scroll. */}
          <div className={styles.chips}>
            <div className={styles.standingChoices}>
              {[78, 74, 84, 86, 60, 104, 64].map((width, i) => (
                <Bone key={i} shape="pill" width={width} height={34} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.group}>
          <Bone width={90} height={12} />
          <div className={styles.photos}>
            {/* An item's photos and the square to add more, wrapping as
                the real ones do. */}
            {Array.from({ length: editing ? 5 : 1 }).map((_, i) => (
              <Bone key={i} shape="block" width={68} height={68} />
            ))}
          </div>
        </div>

        <FieldBones wide />

        {/* A laptop's six details, then condition, price and how many. */}
        <div className={styles.specs}>
          {Array.from({ length: 9 }).map((_, i) => (
            <FieldBones key={i} />
          ))}
        </div>

        <Bone shape="block" height={66} />

        <div className={styles.actions}>
          <Bone shape="pill" height={48} />
          <Bone shape="pill" height={48} />
        </div>
        {editing ? null : (
          <Bone shape="pill" height={48} className={styles.cancel} />
        )}
      </div>
    </ConsoleShell>
  );
}
