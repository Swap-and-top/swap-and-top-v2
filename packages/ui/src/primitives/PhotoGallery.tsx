'use client';

/**
 * PhotoGallery — a listing's photos, one at a time, swiped sideways.
 *
 * The track is a native scroll-snap strip, so a phone swipes it with its own
 * physics and a trackpad scrolls it sideways. Dots show where you are and jump
 * to a photo; on a pointer device, arrows appear on hover for a mouse.
 *
 * With `href`, each photo is a link to the listing: a tap opens it, a swipe
 * does not (the browser drops the click after a scroll). The gallery sits
 * above a card's stretched link, so the dots and arrows stay usable.
 */

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { ImagePlaceholder } from './Placeholder';
import styles from './PhotoGallery.module.css';

export function PhotoGallery({
  images,
  alt,
  href,
  height,
  className,
}: {
  images: readonly string[];
  /** Names the item; each photo is announced as "{alt}, photo 2 of 4". */
  alt: string;
  /** Makes each photo a link, for a card in the feed. */
  href?: string;
  /** CSS height. Leave unset to size the gallery with `className`. */
  height?: number | string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return <ImagePlaceholder height={height ?? 'auto'} flush className={className} />;
  }

  const many = images.length > 1;

  function onScroll() {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(next: number) {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div
      className={[styles.gallery, className ?? ''].filter(Boolean).join(' ')}
      style={{ height }}
      role={many ? 'region' : undefined}
      aria-roledescription={many ? 'carousel' : undefined}
      aria-label={many ? `${alt} photos` : undefined}
    >
      <div ref={track} className={styles.track} onScroll={many ? onScroll : undefined}>
        {images.map((src, i) => {
          const photo = (
            // A plain img until photos come from our own storage.
            <img
              src={src}
              alt={many ? `${alt}, photo ${i + 1} of ${images.length}` : alt}
              loading={i === 0 ? undefined : 'lazy'}
              draggable={false}
              className={styles.photo}
            />
          );
          return href ? (
            // The card's own link carries the name for keyboards and screen
            // readers; these are for pointers and touch only.
            <Link key={src + i} href={href} className={styles.slide} tabIndex={-1}>
              {photo}
            </Link>
          ) : (
            <div key={src + i} className={styles.slide}>
              {photo}
            </div>
          );
        })}
      </div>

      {many ? (
        <>
          <button
            type="button"
            className={[styles.arrow, styles.prev].join(' ')}
            aria-label="Previous photo"
            onClick={() => goTo(index - 1)}
            hidden={index === 0}
          >
            <ChevronLeftIcon size={16} weight={2.4} />
          </button>
          <button
            type="button"
            className={[styles.arrow, styles.next].join(' ')}
            aria-label="Next photo"
            onClick={() => goTo(index + 1)}
            hidden={index === images.length - 1}
          >
            <ChevronRightIcon size={16} weight={2.4} />
          </button>

          <div className={styles.dots}>
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                className={[styles.dot, i === index ? styles.dotActive : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`Photo ${i + 1} of ${images.length}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * The gallery at the top of a listing detail, in the content column with the
 * feed card's rounded corners.
 */
export function ImageCarousel({
  images,
  alt,
}: {
  images: readonly string[];
  alt: string;
}) {
  return (
    <div className={styles.carousel}>
      <PhotoGallery images={images} alt={alt} height="var(--carousel-h)" />
    </div>
  );
}
