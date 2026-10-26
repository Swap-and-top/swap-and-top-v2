'use client';

/**
 * AppToaster — where toasts appear, set up once for the whole app.
 *
 * Bottom left on a desktop; on a phone sonner runs them the full width of
 * the screen, at the bottom: just above a bottom bar where there is one, and
 * otherwise at the foot (see ToastOffset). Green when the thing worked, red
 * when it did not (see globals.css).
 *
 * There is only ever one. A sheet is a native modal <dialog>: it sits above
 * anything on the page, and nothing outside it can be tapped. So while a
 * sheet is open the toasts' container is moved, as it is, into that sheet,
 * and back once it closes (see `placeToasts`). Nothing is drawn again, so a
 * toast already showing stays exactly where it is.
 */

import { Toaster } from 'sonner';

/** Where the container lives while no sheet is open. */
const HOME = 'data-toast-home';

export function AppToaster() {
  return (
    <div {...{ [HOME]: '' }} style={{ display: 'contents' }}>
      <Toaster
        position="bottom-left"
        richColors
        offset={24}
        mobileOffset={{ bottom: 12 }}
        duration={2500}
      />
    </div>
  );
}

/**
 * Puts the toasts' container in the sheet open on top, or back home when
 * none is. `leaving` is a sheet on its way out, passed over.
 */
export function placeToasts(leaving?: HTMLDialogElement | null) {
  const toasts = document.querySelector<HTMLElement>(
    'section[aria-label^="Notifications"]',
  );
  if (!toasts) return;
  const open = [
    ...document.querySelectorAll<HTMLDialogElement>('dialog[open]'),
  ].filter((dialog) => dialog !== leaving);
  const place =
    open[open.length - 1] ?? document.querySelector<HTMLElement>(`[${HOME}]`);
  if (place && toasts.parentElement !== place) place.appendChild(toasts);
}
