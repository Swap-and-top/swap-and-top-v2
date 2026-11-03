'use client';

/**
 * Loading: Overview, in the page's own shape for this person (shape.ts):
 * the strip of tabs (My overview, then their parts of the team), the
 * length and period pills, then the tab it opens on, My overview when it
 * has cards (their count kept in this browser from the last visit), else
 * their first part of the team: always eight tiles, four to a row on a
 * laptop (Hillary, 2026-11-03), and the chart card under them. The page
 * shows it too until the numbers have come.
 */

import { useSyncExternalStore } from 'react';
import { Bone } from '@snt/ui';
import { StaffPage } from '../StaffPage';
import { useOverviewShape } from './shape';
import styles from './page.module.css';

/** Where the count of My overview's cards is kept, by the page. */
export const MINE_COUNT = 'snt-overview-mine';

/** The tiles the skeleton shows, whatever the tab holds. */
const TILES = 8;

/** That count, read from this browser; none on the server or before. */
function useMineCount(): number {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return Number(localStorage.getItem(MINE_COUNT)) || 0;
      } catch {
        return 0;
      }
    },
    () => 0,
  );
}

export default function Loading() {
  // Before the session is known: one tab of eight.
  const parts = useOverviewShape() ?? [{ key: 'section', tiles: 8 }];
  const mine = useMineCount();
  // My overview's tab, but for DevOps alone, who has no cards to choose.
  const choosable = parts.some((part) => part.tiles > 0);
  const shape = choosable ? [{ key: 'mine', tiles: mine }, ...parts] : parts;
  const first = mine > 0 && choosable ? shape[0] : parts[0];
  return (
    <StaffPage
      title="Overview"
      meta="The numbers your part of the team needs, a week, a month or a year at a time"
      actions={
        <>
          {shape.length > 1 ? (
            <div className={styles.tabs}>
              {/* About as wide as their tabs' names. */}
              <Bone shape="pill" width={Math.min(600, shape.length * 95)} height={40} style={{ maxWidth: '100%' }} />
            </div>
          ) : null}
          <div className={styles.controls}>
            <Bone shape="pill" width={210} height={36} />
            <Bone shape="pill" width={200} height={36} />
          </div>
        </>
      }
    >
      <div aria-busy aria-label="Loading">
        {first?.key === 'mine' ? (
          <div className={styles.mineBar}>
            <Bone width={220} height={13} />
            <Bone shape="pill" width={200} height={36} />
          </div>
        ) : null}
        {!first || first.note ? (
          <div className={styles.notePanel}>
            <Bone width="70%" height={13} />
          </div>
        ) : (
          <>
            <div className={styles.tiles}>
              {Array.from({ length: TILES }, (_, i) => (
                <div key={i} className={styles.tile}>
                  <Bone width={100} height={13} />
                  <Bone width={60} height={26} />
                  <Bone width={130} height={11} />
                </div>
              ))}
            </div>
            <div className={styles.card}>
              <Bone width={190} height={16} style={{ marginBottom: 24 }} />
              <Bone shape="block" height={240} />
            </div>
          </>
        )}
      </div>
    </StaffPage>
  );
}
