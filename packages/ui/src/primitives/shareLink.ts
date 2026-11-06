'use client';

/**
 * Sharing a listing or a store: the device's own share window (Android's,
 * an iPhone's, a Mac's in Safari), which is what Hillary wants (2026-11-06).
 * A browser without one (Chrome and Firefox on many laptops) copies the
 * link instead and says "Link copied"; so does a share window that refuses
 * rather than being closed.
 */

import { toast } from 'sonner';

/** Copies text by the older way, for browsers that block the clipboard. */
function copyTheOldWay(text: string): boolean {
  const box = document.createElement('textarea');
  box.value = text;
  box.setAttribute('readonly', '');
  box.style.position = 'fixed';
  box.style.opacity = '0';
  document.body.appendChild(box);
  box.select();
  let done = false;
  try {
    done = document.execCommand('copy');
  } catch {
    done = false;
  }
  box.remove();
  return done;
}

export async function shareLink({ title, url }: { title: string; url: string }): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (error) {
      // Closed by the person: nothing to do. Refused: copy it instead.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  let copied = false;
  try {
    await navigator.clipboard.writeText(url);
    copied = true;
  } catch {
    copied = copyTheOldWay(url);
  }
  if (copied) toast.success('Link copied');
  else toast.error('We could not copy the link. Copy it from the address bar.');
}
