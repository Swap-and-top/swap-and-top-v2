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

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../icons';
import { ImagePlaceholder } from './Placeholder';
import styles from './PhotoGallery.module.css';

/**
 * Who posted the photos, which sets the viewer's tint to match the card: an
 * individual's sale or swap is blue, a Wanted post green, a shop's untinted.
 */
export type PhotoTone = 'person' | 'wanted' | 'shop';

/**
 * The rubber band at the ends of a photo strip. Swipe towards a photo that is
 * not there — back from the first, on from the last, either way from an only
 * photo — and the photo stretches towards the finger like a rubber band,
 * less the further it is pulled, then eases back when let go. It says "that
 * is all of them" without a word.
 *
 * A stretch, not a slide: the photo never leaves its frame. The edge the
 * pull comes from stays pinned where it is, no gap opens behind it, and only
 * the picture gives. The same on every phone, so the browser's own edge
 * effect — a bounce on an iPhone, a glow elsewhere — is switched off for the
 * strip. Touch only: a mouse has the arrows, which go away at the ends.
 */
function useRubberBand(track: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = track.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let atStart = false;
    let atEnd = false;
    /** Undecided until the finger has moved enough to tell across from down. */
    let across: boolean | null = null;
    let pulled = false;
    /** Where the strip is held while it is being pulled, or null. */
    let heldAt: number | null = null;
    let release: ReturnType<typeof setTimeout> | undefined;

    // A pull must only ever stretch. Left alone, the strip would still take
    // the same finger as a swipe — so a hard pull that eases back even a
    // little flicks it over to the neighbouring photo. While pulled, the
    // strip is held where it is and cannot be scrolled.
    const hold = () => {
      if (heldAt !== null) return;
      heldAt = el.scrollLeft;
      el.style.overflowX = 'hidden';
    };
    const letGo = () => {
      clearTimeout(release);
      if (heldAt === null) return;
      el.scrollLeft = heldAt;
      heldAt = null;
      el.style.overflowX = '';
    };
    const onScroll = () => {
      if (heldAt !== null && el.scrollLeft !== heldAt) el.scrollLeft = heldAt;
    };

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1) return;
      // A new touch before the last pull has settled: free the strip first.
      letGo();
      startX = touch.clientX;
      startY = touch.clientY;
      atStart = el.scrollLeft <= 1;
      atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      across = null;
      pulled = false;
    };

    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (across === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        across = Math.abs(dx) > Math.abs(dy);
      }
      if (!across) return;

      // Only against an end: right from the first photo, left from the last.
      const against = (dx > 0 && atStart) || (dx < 0 && atEnd);
      if (!against) {
        // Eased back past where the pull began: flat again, but still held —
        // the rest of this touch does not turn into a swipe.
        if (pulled) el.style.transform = '';
        return;
      }

      // The further the pull, the less it gives, and it is slight, as on
      // Android: a long drag adds about a twentieth to the width.
      const width = el.clientWidth || 1;
      const distance = Math.abs(dx);
      const give = (1 - 1 / ((distance * 0.55) / width + 1)) * width;
      pulled = true;
      hold();
      el.style.transition = 'none';
      // Pinned at the edge the pull starts from, stretching after the finger.
      el.style.transformOrigin = dx > 0 ? 'left center' : 'right center';
      el.style.transform = `scaleX(${1 + give / (5 * width)})`;
    };

    const onEnd = () => {
      if (!pulled) return;
      // Let go: it snaps most of the way back, then eases to rest.
      el.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = '';
      // Held until it has settled, so nothing left of the touch moves it.
      clearTimeout(release);
      release = setTimeout(letGo, 400);
    };

    // A pull is not a tap: do not open the photo it started on.
    const onClick = (event: MouseEvent) => {
      if (!pulled) return;
      pulled = false;
      event.preventDefault();
      event.stopPropagation();
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    el.addEventListener('click', onClick, true);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      letGo();
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      el.removeEventListener('click', onClick, true);
    };
  }, [track]);
}

export function PhotoGallery({
  images,
  alt,
  tone = 'shop',
  height,
  className,
}: {
  images: readonly string[];
  /** Names the item; each photo is announced as "{alt}, photo 2 of 4". */
  alt: string;
  /** Tints the full-screen viewer to match the card. */
  tone?: PhotoTone;
  /** CSS height. Leave unset to size the gallery with `className`. */
  height?: number | string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  /** The photo open in the viewer, or null when it is closed. */
  const [viewing, setViewing] = useState<number | null>(null);
  useRubberBand(track);

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
              {/* The v1 fit: the whole photo, never cropped, over a blurred
                  copy of itself that fills whatever space its shape leaves.
                  Plain imgs until photos come from our own storage. */}
              <img
                src={src}
                alt=""
                loading={i === 0 ? undefined : 'lazy'}
                draggable={false}
                className={styles.backdrop}
                aria-hidden
              />
              <img
                src={src}
                alt=""
                loading={i === 0 ? undefined : 'lazy'}
                draggable={false}
                className={[styles.photo, styles.fitted].join(' ')}
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
          tone={tone}
          startIndex={viewing}
          onClose={closeViewer}
        />
      ) : null}
    </div>
  );
}

/**
 * A small photo that opens the full-screen viewer — for a card that shows a
 * photo alongside something else, like the trade-in on a Wanted card. With
 * more than one photo, a count sits in its corner.
 */
export function PhotoThumb({
  images,
  alt,
  tone = 'shop',
  size = 44,
  className,
}: {
  images: readonly string[];
  alt: string;
  tone?: PhotoTone;
  /** Width and height in px. */
  size?: number;
  className?: string;
}) {
  const [viewing, setViewing] = useState(false);

  if (images.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={[styles.thumb, className ?? ''].filter(Boolean).join(' ')}
        style={{ width: size, height: size }}
        aria-label={`View ${alt} photos`}
        onClick={() => setViewing(true)}
      >
        <img src={images[0]} alt="" draggable={false} className={styles.photo} />
        {images.length > 1 ? (
          <span className={styles.thumbCount} aria-hidden>
            {images.length}
          </span>
        ) : null}
      </button>

      {viewing ? (
        <PhotoViewer
          images={images}
          alt={alt}
          tone={tone}
          startIndex={0}
          onClose={() => setViewing(false)}
        />
      ) : null}
    </>
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
  tone,
  startIndex,
  onClose,
}: {
  images: readonly string[];
  alt: string;
  tone: PhotoTone;
  startIndex: number;
  /** Called with the photo on show, so the gallery can follow. */
  onClose: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const many = images.length > 1;
  useRubberBand(track);

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
      className={[styles.viewer, styles[tone]].join(' ')}
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
  tone,
}: {
  images: readonly string[];
  alt: string;
  tone?: PhotoTone;
}) {
  return (
    <div className={styles.carousel}>
      <PhotoGallery
        images={images}
        alt={alt}
        tone={tone}
        height="var(--carousel-h)"
      />
    </div>
  );
}
