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

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
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
 * Where a photo's picture actually sits on screen. A photo shown whole inside
 * a frame of another shape ("contain") leaves blurred space round it; this is
 * the picture itself, not the frame.
 */
function pictureRect(img: HTMLImageElement | null | undefined): DOMRect | null {
  if (!img) return null;
  const box = img.getBoundingClientRect();
  if (getComputedStyle(img).objectFit !== 'contain' || !img.naturalWidth) {
    return box;
  }
  const scale = Math.min(
    box.width / img.naturalWidth,
    box.height / img.naturalHeight,
  );
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  return new DOMRect(
    box.left + (box.width - width) / 2,
    box.top + (box.height - height) / 2,
    width,
    height,
  );
}

/**
 * The transform that puts a picture at rest at `to` exactly over `from`:
 * scaled about its top-left corner (see .viewerPhoto) and moved so the two
 * centres meet.
 */
function zoomFrom(from: DOMRect, to: DOMRect): string {
  const scale = from.width / to.width;
  const x = from.left + from.width / 2 - (to.left + (to.width * scale) / 2);
  const y = from.top + from.height / 2 - (to.top + (to.height * scale) / 2);
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

const calm = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /**
   * Where the card's picture of photo `index` is — the viewer zooms out of
   * it and back into it. The card is first turned to that photo, under the
   * viewer, so closing lands on the photo that was on show.
   */
  function cardPicture(index: number): DOMRect | null {
    goTo(index, 'instant');
    return pictureRect(
      track.current?.querySelector<HTMLImageElement>(`[data-photo="${index}"]`),
    );
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
                data-photo={i}
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
          origin={cardPicture}
          onClose={() => setViewing(null)}
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
  const photo = useRef<HTMLImageElement>(null);

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
        <img
          ref={photo}
          src={images[0]}
          alt=""
          draggable={false}
          className={styles.photo}
        />
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
          // It zooms out of the thumbnail, and back into it from the first
          // photo, which is the one the thumbnail shows.
          origin={(index) =>
            index === 0 ? (photo.current?.getBoundingClientRect() ?? null) : null
          }
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
  origin,
  onClose,
}: {
  images: readonly string[];
  alt: string;
  tone: PhotoTone;
  startIndex: number;
  /**
   * Where photo `index` sits on the page behind — the viewer zooms the photo
   * out of there on opening and back into it on closing. Null: no zoom.
   */
  origin?: (index: number) => DOMRect | null;
  /** Called once the viewer has gone. */
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const closing = useRef(false);
  const many = images.length > 1;
  useRubberBand(track);

  const photoAt = (i: number) =>
    track.current?.querySelector<HTMLImageElement>(`[data-viewer-photo="${i}"]`);
  /** The controls over the photo: counter, close, arrows, dots. */
  const controls = () =>
    Array.from(
      dialog.current?.querySelectorAll<HTMLElement>('[data-control]') ?? [],
    );

  // Before paint, so the photo is already over its place on the card when
  // the viewer is first seen, and zooms up from there.
  useLayoutEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (!el.open) el.showModal();
    // Open on the photo that was tapped.
    const strip = track.current;
    if (strip) strip.scrollLeft = startIndex * strip.clientWidth;

    // The zoom in: the photo grows from its place on the card to its place
    // here, as the dimmed page and the controls fade in round it.
    const photo = photoAt(startIndex);
    // Measured at rest: any zoom already under way (an effect run twice in
    // development) is stopped first, or it would be measured mid-flight.
    photo?.getAnimations().forEach((animation) => animation.cancel());
    const from = origin?.(startIndex);
    const to = pictureRect(photo);
    if (photo && from && to && !calm()) {
      photo.animate([{ transform: zoomFrom(from, to) }, { transform: 'none' }], {
        duration: 420,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
      });
      shade.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 420,
        easing: 'ease',
      });
      for (const control of controls()) {
        control.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 240,
          delay: 160,
          fill: 'backwards',
        });
      }
    }
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

  /**
   * The zoom out, the zoom in reversed: the photo on show shrinks back down
   * onto its place on the card, as the dimmed page and the controls fade
   * away; then the viewer goes. However it is closed — the cross, a tap
   * beside the photo, Escape.
   */
  function close() {
    if (closing.current) return;
    closing.current = true;

    const photo = photoAt(index);
    const from = origin?.(index);
    const to = pictureRect(photo);
    if (!photo || !from || !to || calm()) {
      onClose();
      return;
    }

    const easing = 'cubic-bezier(0.3, 0, 0, 1)';
    for (const control of controls()) {
      control.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 120,
        fill: 'forwards',
      });
    }
    shade.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 380,
      easing: 'ease',
      fill: 'forwards',
    });
    const zoom = photo.animate(
      [{ transform: 'none' }, { transform: zoomFrom(from, to) }],
      { duration: 380, easing, fill: 'forwards' },
    );
    // Gone once it lands — or just after, if the end is never reported.
    const done = window.setTimeout(onClose, 500);
    void zoom.finished.then(
      () => {
        window.clearTimeout(done);
        onClose();
      },
      () => {},
    );
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
        close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goTo(index - 1);
        if (event.key === 'ArrowRight') goTo(index + 1);
      }}
    >
      {/* The dimmed, blurred page behind the photo — its own layer, so it
          can fade while the photo zooms. */}
      <div
        ref={shade}
        className={[styles.viewerShade, styles[tone]].join(' ')}
        aria-hidden
      />
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
              if (event.target === event.currentTarget) close();
            }}
          >
            <img
              src={src}
              alt={many ? `${alt}, photo ${i + 1} of ${images.length}` : alt}
              draggable={false}
              className={styles.viewerPhoto}
              data-viewer-photo={i}
            />
          </div>
        ))}
      </div>

      {many ? (
        <div className={styles.counter} aria-live="polite" data-control>
          {index + 1} / {images.length}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.close}
        data-control
        aria-label="Close photos"
        onClick={close}
        autoFocus
      >
        <CloseIcon size={20} weight={2.2} />
      </button>

      {many ? (
        <>
          <button
            type="button"
            className={[styles.viewerArrow, styles.prev].join(' ')}
            data-control
            aria-label="Previous photo"
            onClick={() => goTo(index - 1)}
            hidden={index === 0}
          >
            <ChevronLeftIcon size={22} weight={2.2} />
          </button>
          <button
            type="button"
            className={[styles.viewerArrow, styles.next].join(' ')}
            data-control
            aria-label="Next photo"
            onClick={() => goTo(index + 1)}
            hidden={index === images.length - 1}
          >
            <ChevronRightIcon size={22} weight={2.2} />
          </button>

          <div
            className={[styles.dots, styles.viewerDots].join(' ')}
            data-control
          >
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
