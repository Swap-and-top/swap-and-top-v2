/**
 * Skeletons — what a screen looks like while its data is on the way.
 *
 * Built from one piece, the Bone: a soft pale blue shape in the place and
 * size of what will come, a block for a photo, a short bar for a title or a
 * price. Every bone on the screen pulses together, slowly, by fading a little
 * and back, never with a sweeping shine. When the data arrives the real
 * screen replaces them in the same places, so nothing jumps.
 *
 * Data and photos wait separately. These stand in for a whole card or page
 * while its data loads; once the data is here, the text shows at once and
 * only each photo keeps its own skeleton until it has loaded (see Img).
 *
 * Each page builds its own skeleton from these and from its own styles (see
 * the loading.tsx beside each page), so the shapes match what will come.
 */

import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

/** One shape: a bar for text, a block for a photo, a pill for a button. */
export function Bone({
  width = '100%',
  height = 12,
  shape = 'bar',
  className,
  style,
  ...rest
}: {
  width?: number | string;
  height?: number | string;
  shape?: 'bar' | 'block' | 'pill' | 'circle';
  className?: string;
  style?: CSSProperties;
  /** Marks it for a layout that reacts to it, as the real element does. */
  'data-stack-on-phone'?: string;
}) {
  return (
    <span
      aria-hidden
      // Marks a page as still waiting, for the top loading bar.
      data-skeleton=""
      className={[styles.bone, styles[shape], className ?? '']
        .filter(Boolean)
        .join(' ')}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}

/** A feed card for sale, waiting: the photo, the name and specs, the price. */
export function SaleCardSkeleton() {
  return (
    <div className={styles.card}>
      <Bone shape="block" height="auto" className={styles.photo} />
      <div className={styles.body}>
        <div className={styles.summary}>
          <div className={styles.lines}>
            <Bone width="62%" height={18} />
            <Bone width="44%" height={13} />
          </div>
          <div className={[styles.lines, styles.end].join(' ')}>
            <Bone width={64} height={20} />
            <Bone width={78} height={13} />
          </div>
        </div>
        <div className={styles.foot}>
          <Bone width="56%" height={14} />
          <Bone width={52} height={24} />
        </div>
      </div>
    </div>
  );
}

/** A swap card, waiting: the two tiles side by side, then the poster's line. */
export function SwapCardSkeleton() {
  return (
    <div className={styles.card}>
      {/* Each tile holds its photo and its words, so each is one block. */}
      <div className={styles.tiles}>
        <Bone shape="block" height={237} />
        <Bone shape="block" height={237} />
      </div>
      <div className={[styles.foot, styles.swapFoot].join(' ')}>
        <Bone width="50%" height={14} />
        <Bone width={52} height={24} />
      </div>
    </div>
  );
}

/** A wanted card, waiting: no photo, the request, the budget, the button. */
export function WantedCardSkeleton() {
  return (
    <div className={[styles.card, styles.padded].join(' ')}>
      <div className={styles.foot}>
        <Bone width={80} height={16} />
        <Bone width={110} height={14} />
      </div>
      <div className={styles.wanted}>
        <div className={styles.lines}>
          <Bone width="72%" height={20} />
          <Bone width="50%" height={14} />
        </div>
        <Bone shape="pill" width={112} height={44} />
      </div>
      <div className={styles.foot}>
        <Bone width="34%" height={16} />
        <Bone width={52} height={24} />
      </div>
    </div>
  );
}
