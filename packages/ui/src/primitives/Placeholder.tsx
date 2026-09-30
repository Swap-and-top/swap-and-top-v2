/**
 * ImagePlaceholder, Avatar and ShopMark. The photo carousel is in PhotoGallery.
 *
 * A photo slot shows the listing's photo, cropped to fill, when there is one,
 * and a plain grey box otherwise. The image glyph only shows on an empty
 * draft, where it prompts the poster to add one. Move to `next/image` once
 * photos come from our own storage.
 */

import type { Listing } from '@snt/core';
import { ImageIcon, ImageSmallIcon, PersonIcon } from '../icons';
import styles from './Placeholder.module.css';

/** The cover photo: the first in the list, if there is one. */
export function firstPhoto(images: readonly string[] | undefined) {
  return images?.[0];
}

/**
 * The photo that represents a listing: the item for a sale or auction, what
 * the poster has for a swap, and the trade-in for a request that carries one.
 * A plain request has nothing to photograph.
 */
export function listingPhoto(listing: Listing) {
  switch (listing.type) {
    case 'swap':
      return firstPhoto(listing.has.images);
    case 'request':
      return firstPhoto(listing.tradeIn?.images);
    default:
      return firstPhoto(listing.item.images);
  }
}

export interface ImagePlaceholderProps {
  /** Photo URL. Without one the slot is drawn as the grey placeholder. */
  src?: string;
  /** Alt text for the photo. Leave empty where a caption already names it. */
  alt?: string;
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
  src,
  alt = '',
  height,
  width,
  empty = false,
  flush = false,
  small = false,
  className,
}: ImagePlaceholderProps) {
  const Glyph = small ? ImageSmallIcon : ImageIcon;

  if (src) {
    return (
      // A plain img until photos come from our own storage (see top).
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={[styles.image, styles.photo, flush ? styles.flush : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        style={{ height, width }}
      />
    );
  }

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
