/**
 * ImagePlaceholder, ImageCarousel, Avatar and ShopMark.
 *
 * Swap `ImagePlaceholder` for `next/image` once listings carry real photo URLs.
 * A photo slot is drawn as a plain grey box, as in the design; the image glyph
 * only shows on an empty draft, where it prompts the poster to add one.
 */

import { ImageIcon, ImageSmallIcon, PersonIcon } from '../icons';
import styles from './Placeholder.module.css';

export interface ImagePlaceholderProps {
  /** CSS height. Width fills the container unless `width` is given. */
  height: number | string;
  width?: number | string;
  /** No photo at all yet, e.g. a draft listing. Shows the image glyph. */
  empty?: boolean;
  /** Square corners, for a full-bleed card header. */
  flush?: boolean;
  /** Smaller glyph, for thumbnails under ~80px. */
  small?: boolean;
  className?: string;
}

export function ImagePlaceholder({
  height,
  width,
  empty = false,
  flush = false,
  small = false,
  className,
}: ImagePlaceholderProps) {
  const Glyph = small ? ImageSmallIcon : ImageIcon;

  return (
    <div
      className={[
        styles.image,
        empty ? styles.empty : styles.bare,
        flush ? styles.flush : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height, width }}
      aria-hidden
    >
      <Glyph size={small ? 19 : 26} />
    </div>
  );
}

/**
 * Placeholder carousel with position dots, for the top of a listing detail.
 * Sits in the content column with the feed card's rounded corners.
 */
export function ImageCarousel({
  count,
  activeIndex = 0,
  height = 'var(--carousel-h)',
}: {
  count: number;
  activeIndex?: number;
  height?: number | string;
}) {
  return (
    <div className={styles.carousel}>
      <ImagePlaceholder height={height} flush />
      {count > 1 ? (
        <div className={styles.dots} aria-hidden>
          {Array.from({ length: count }).map((_, index) => (
            <span
              key={index}
              className={[
                styles.dot,
                index === activeIndex ? styles.dotActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Avatar({ size = 36 }: { size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size }} aria-hidden>
      <PersonIcon size={Math.round(size * 0.52)} />
    </span>
  );
}

/** A shop's square initials mark, standing in for a logo. */
export function ShopMark({
  initials,
  size = 20,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <span
      className={styles.shopMark}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.42)),
        // Corners scale with the mark: ~6px at the feed card's 40px.
        borderRadius: Math.max(3, Math.round(size * 0.15)),
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
