'use client';

/**
 * Img — every photo in the app, loaded the same way.
 *
 * Until the picture has fully arrived, its box is a skeleton: the exact shape
 * the photo will fill, pulsing slowly between two soft blues. The photo itself
 * is kept out of sight meanwhile, so it never paints in strips from the top
 * down; once it has loaded it fades in whole.
 *
 * A photo the browser already has (cached, or loaded before the page woke up)
 * is shown at once, with no skeleton and no fade.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type Ref,
} from 'react';
import styles from './Img.module.css';

export interface ImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  ref?: Ref<HTMLImageElement>;
  /**
   * Pulse while loading. Off for pictures over a dark or busy ground, such as
   * the full screen viewer or a drawing with a clear background: those are
   * simply hidden until loaded, then fade in.
   */
  pulse?: boolean;
}

export function Img({
  ref,
  pulse = true,
  className,
  src,
  onLoad,
  onError,
  ...rest
}: ImgProps) {
  // Which picture has arrived, so a new src starts from the skeleton again.
  const [shown, setShown] = useState<string | undefined>(undefined);
  // Already there when first drawn: no fade, it is simply shown.
  const [instant, setInstant] = useState(false);
  const own = useRef<HTMLImageElement | null>(null);

  const setRef = useCallback(
    (el: HTMLImageElement | null) => {
      own.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLImageElement | null }).current = el;
    },
    [ref],
  );

  useEffect(() => {
    const el = own.current;
    if (el && typeof src === 'string' && el.complete && el.naturalWidth > 0) {
      setInstant(true);
      setShown(src);
    }
  }, [src]);

  const loaded = typeof src === 'string' && shown === src;

  return (
    <img
      ref={setRef}
      src={src}
      className={[
        loaded ? (instant ? '' : styles.arrived) : styles.loading,
        !loaded && pulse ? styles.pulse : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onLoad={(event) => {
        setShown(src as string);
        onLoad?.(event);
      }}
      onError={(event) => {
        // Nothing more is coming: stop the pulse rather than pulse forever.
        setShown(src as string);
        onError?.(event);
      }}
      {...rest}
    />
  );
}
