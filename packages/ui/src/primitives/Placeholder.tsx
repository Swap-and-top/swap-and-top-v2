/**
 * ImagePlaceholder, ImageCarousel, Avatar and ShopMark.
 *
 * Swap `ImagePlaceholder` for `next/image` once listings carry real photo URLs.
 * The `wanted` variant — a dashed border — is load-bearing: it is how a swap
 * card communicates "they do not own this yet" at a glance.
 */

import { ImageIcon, ImageSmallIcon, PersonIcon } from '../icons';
import styles from './Placeholder.module.css';

export interface ImagePlaceholderProps {
  /** CSS height. Width fills the container unless `width` is given. */
  height: number | string;
  width?: number | string;
  /** Dashed outline: the poster does not own this item. */
  wanted?: boolean;
  /** No photo at all yet, e.g. a draft listing. */
  empty?: boolean;
  /** Sitting on a tinted panel rather than a white card. */
  onTint?: boolean;
  /** Square corners, for a full-bleed card header. */
  flush?: boolean;
  /** Smaller glyph, for thumbnails under ~80px. */
  small?: boolean;
  /** Overrides the glyph entirely, e.g. a magnifier on the "wants" tile. */
  glyph?: 'image' | 'search';
  className?: string;
}

export function ImagePlaceholder({
  height,
  width,
  wanted = false,
  empty = false,
  onTint = false,
  flush = false,
  small = false,
  glyph = 'image',
  className,
}: ImagePlaceholderProps) {
  const Glyph =
    glyph === 'search' ? SearchGlyph : small ? ImageSmallIcon : ImageIcon;

  return (
    <div
      className={[
        styles.image,
        onTint ? styles.onTint : '',
        wanted ? styles.wanted : '',
        empty ? styles.empty : '',
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

/** Magnifier, used on the "what they want" tile of a swap. */
function SearchGlyph({ size }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

/** Placeholder carousel with position dots, for a listing detail header. */
export function ImageCarousel({
  count,
  activeIndex = 0,
  height = 196,
}: {
  count: number;
  activeIndex?: number;
  height?: number;
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
        borderRadius: size >= 40 ? 'var(--snt-radius-xl)' : undefined,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
