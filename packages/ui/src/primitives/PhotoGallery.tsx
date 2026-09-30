'use client';

/**
 * PhotoGallery — a listing's photos, one at a time, swiped sideways.
 *
 * The track is a native scroll-snap strip, so a phone swipes it with its own
 * physics and a trackpad scrolls it sideways. Dots show where you are and jump
 * to a photo; on a pointer device, arrows appear on hover for a mouse.
 *
 * Tapping a photo opens it full screen in PhotoViewer; a swipe does not (the
 * browser drops the click after a scroll). On a card, the gallery sits above
 * the card's stretched link, so the photo opens the viewer and the rest of the
 * card opens the listing.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../icons';
import { ImagePlaceholder } from './Placeholder';
import styles from './PhotoGallery.module.css';

export function PhotoGallery({
  images,
  alt,
  height,
  className,
}: {
  images: readonly string[];
  /** Names the item; each photo is announced as "{alt}, photo 2 of 4". */
  alt: string;
  /** CSS height. Leave unset to size the gallery with `className`. */
  height?: number | string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  /** The photo open in the viewer, or null when it is closed. */
  const [viewing, setViewing] = useState<number | null>(null);

  if (images.length === 0) {
    return <ImagePlaceholder height={height ?? 'auto'} flush className={className} />;
  }

  const many = images.length > 1;

  function onScroll() {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(next: number, behavior: ScrollBehavior = 'smooth') {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior });
  }

  /** Closing the viewer leaves the card on the photo it was showing. */
  function closeViewer(last: number) {
    setViewing(null);
    goTo(last, 'instant');
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
          const label = many ? `${alt}, photo ${i + 1} of ${images.length}` : alt;
          return (
            <button
              key={src + i}
              type="button"
              className={styles.slide}
              aria-label={`View ${label}`}
              onClick={() => setViewing(i)}
            >
              {/* A plain img until photos come from our own storage. */}
              <img
                src={src}
                alt=""
                loading={i === 0 ? undefined : 'lazy'}
                draggable={false}
                className={styles.photo}
              />
            </button>
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

      {viewing !== null ? (
        <PhotoViewer
          images={images}
          alt={alt}
          startIndex={viewing}
          onClose={closeViewer}
        />
      ) : null}
    </div>
  );
}

/**
 * Full-screen photo viewer: the photos whole (not cropped) over the blurred,
 * blue-tinted page, swiped like the gallery, with arrows, dots, a counter and
 * a close button.
 * Escape, the close button or a tap beside the photo closes it; the arrow keys
 * move between photos.
 *
 * A native modal <dialog>, portalled to <body> so no card's clipping or
 * transform reaches it; it holds focus while open and returns it on close.
 */
function PhotoViewer({
  images,
  alt,
  startIndex,
  onClose,
}: {
  images: readonly string[];
  alt: string;
  startIndex: number;
  /** Called with the photo on show, so the gallery can follow. */
  onClose: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const many = images.length > 1;

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    // Open on the photo that was tapped.
    const strip = track.current;
    if (strip) strip.scrollLeft = startIndex * strip.clientWidth;
    // The page behind stays put while the viewer is open.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [startIndex]);

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

  return createPortal(
    <dialog
      ref={dialog}
      className={styles.viewer}
      aria-label={`${alt} photos`}
      onCancel={(event) => {
        // Escape: close through React rather than letting the dialog shut
        // itself, so the gallery hears about it.
        event.preventDefault();
        onClose(index);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goTo(index - 1);
        if (event.key === 'ArrowRight') goTo(index + 1);
      }}
    >
      <div
        ref={track}
        className={styles.viewerTrack}
        onScroll={many ? onScroll : undefined}
      >
        {images.map((src, i) => (
          <div
            key={src + i}
            className={styles.viewerSlide}
            // A tap beside the photo, not on it, closes the viewer.
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose(index);
            }}
          >
            <img
              src={src}
              alt={many ? `${alt}, photo ${i + 1} of ${images.length}` : alt}
              draggable={false}
              className={styles.viewerPhoto}
            />
          </div>
        ))}
      </div>

      {many ? (
        <div className={styles.counter} aria-live="polite">
          {index + 1} / {images.length}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.close}
        aria-label="Close photos"
        onClick={() => onClose(index)}
        autoFocus
      >
        <CloseIcon size={20} weight={2.2} />
      </button>

      {many ? (
        <>
          <button
            type="button"
            className={[styles.viewerArrow, styles.prev].join(' ')}
            aria-label="Previous photo"
            onClick={() => goTo(index - 1)}
            hidden={index === 0}
          >
            <ChevronLeftIcon size={22} weight={2.2} />
          </button>
          <button
            type="button"
            className={[styles.viewerArrow, styles.next].join(' ')}
            aria-label="Next photo"
            onClick={() => goTo(index + 1)}
            hidden={index === images.length - 1}
          >
            <ChevronRightIcon size={22} weight={2.2} />
          </button>

          <div className={[styles.dots, styles.viewerDots].join(' ')}>
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
    </dialog>,
    document.body,
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
