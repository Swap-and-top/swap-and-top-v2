'use client';

/**
 * A banned account sees one page, wherever they go: that they are banned,
 * why, and the box to appeal it (the appeal page, for their ban). Only the
 * pages in the menu's help band (safety tips, terms, privacy) stay open to
 * them. The API refuses them everything else too (apps/api/src/app.ts).
 * Once a ban is overturned, the app is theirs again.
 *
 * The browser remembers a ban, for that account only (by its Supabase user
 * id, matched to the session saved here), so on a reload the ban page shows at once,
 * waiting for the API, rather than the marketplace first. Signing out
 * from it goes home, not to whatever page lay under the ban.
 */

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { useSessionStore } from '@snt/core';
import AppealPage from '@/app/appeal/[id]/PageContent';

const REMEMBERED = 'snt-banned';

/** The Supabase user whose session is saved in this browser. */
function savedUserId(): string | null {
  const key = Object.keys(localStorage).find((name) => name.startsWith('sb-') && name.endsWith('-auth-token'));
  if (!key) return null;
  try {
    return (JSON.parse(localStorage.getItem(key) ?? '') as { user?: { id?: string } }).user?.id ?? null;
  } catch {
    return null;
  }
}

/** Whether the account saved here is the one this browser last saw banned. */
function rememberedBan(): boolean {
  try {
    const id = savedUserId();
    return Boolean(id) && localStorage.getItem(REMEMBERED) === id;
  } catch {
    return false;
  }
}
const OPEN_TO_THEM = ['/help', '/terms', '/privacy'];

export function BannedGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  /** Shown the ban, then signed out: on the way home. */
  const [leaving, setLeaving] = useState(false);
  const signedIn = useSessionStore((state) => state.signedIn);
  const viewer = useSessionStore((state) => state.viewer);
  const [remembered, setRemembered] = useState(false);

  // Again on each sign in: someone else signing in here is not the one banned.
  useLayoutEffect(() => {
    setRemembered(signedIn && rememberedBan());
  }, [signedIn]);

  useEffect(() => {
    if (!viewer) return;
    const banned = viewer.standing === 'banned';
    setRemembered(banned);
    if (banned) document.documentElement.setAttribute('data-banned', '');
    else document.documentElement.removeAttribute('data-banned');
    try {
      const id = savedUserId();
      if (banned && id) localStorage.setItem(REMEMBERED, id);
      else localStorage.removeItem(REMEMBERED);
    } catch {
      // No storage.
    }
  }, [viewer]);

  const banned = viewer ? viewer.standing === 'banned' : signedIn && remembered;

  const [wasBanned, setWasBanned] = useState(false);
  useEffect(() => {
    if (banned) setWasBanned(true);
    else if (wasBanned && !signedIn) {
      setWasBanned(false);
      setLeaving(true);
      router.replace('/');
    }
  }, [banned, signedIn, wasBanned, router]);
  useEffect(() => {
    if (leaving && pathname === '/') setLeaving(false);
  }, [leaving, pathname]);

  if (leaving) return null;
  if (!banned || OPEN_TO_THEM.some((path) => pathname?.startsWith(path))) return <>{children}</>;
  return <AppealPage id={viewer?.banActionId} banned waiting={!viewer} />;
}
