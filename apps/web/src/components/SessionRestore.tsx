'use client';

/**
 * Keeps the session store in step with who is signed in (lib/account.ts):
 * the account this browser has noted as the app loads, and whenever someone
 * signs in or out, here or in another tab (the one effect here: it listens,
 * it loads nothing). Who it is
 * (GET /api/me) and then what is theirs (lib/accountData: offers, deals,
 * saved listings, notifications, boosts) are TanStack Queries: tried again
 * when the server cannot be reached, read again now and then (so a ban, say,
 * shows), and their answers put in the stores the app reads. When who it is
 * cannot be loaded, the session store says so (`viewerFailed`): the sign in
 * page stops and says so, and anywhere else a toast does.
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSessionStore, type Viewer } from '@snt/core';
import { clearAccountData, loadAccountData } from '@/lib/accountData';
import { noteFirstSource, sendFirstSource } from '@/lib/firstSource';
import { apiGet } from '@/lib/query';
import { onAccountChange, savedAccountId, signOut } from '@/lib/account';
import { viewerKey } from '@/lib/viewer';

export function SessionRestore() {
  /** The account signed in, once this browser's note is read. */
  const [authUserId, setAuthUserId] = useState<string | undefined>();

  // Before the first paint: if an account is noted as signed in here, draw
  // signed in straight away rather than flashing the signed out page.
  useLayoutEffect(() => {
    try {
      // The old stand in session, from before real sign in.
      localStorage.removeItem('snt-session');
    } catch {
      // No storage.
    }
    if (savedAccountId()) useSessionStore.setState({ signedIn: true });
  }, []);

  useEffect(() => {
    // Where this visitor came from, kept for when they join (lib/firstSource).
    noteFirstSource();
    useSessionStore.setState({
      signOut: () =>
        void signOut().then((done) => {
          if (done) toast.success('Signed out successfully');
        }),
    });

    let current: string | undefined;
    return onAccountChange((accountId, why) => {
      // The mark the header reads from the first paint (see the layout).
      const html = document.documentElement;
      if (accountId) html.setAttribute('data-signed-in', '');
      else html.removeAttribute('data-signed-in');
      if (!accountId) {
        current = undefined;
        setAuthUserId(undefined);
        clearAccountData();
        // A ban seen here belonged to whoever has signed out.
        html.removeAttribute('data-banned');
        try {
          localStorage.removeItem('snt-banned');
        } catch {
          // No storage.
        }
        useSessionStore.setState({
          signedIn: false,
          viewer: null,
          viewerFailed: false,
          restored: true,
          ...(why === 'signed-out' ? { signedOutAt: Date.now() } : {}),
        });
        return;
      }
      // Someone else signing in: drop the last name until the API answers,
      // and the banned mark unless the ban was theirs.
      const changed = accountId !== current;
      try {
        if (localStorage.getItem('snt-banned') !== accountId) html.removeAttribute('data-banned');
      } catch {
        // No storage.
      }
      current = accountId;
      setAuthUserId(accountId);
      useSessionStore.setState({
        signedIn: true,
        restored: true,
        ...(changed ? { viewer: null, viewerFailed: false } : {}),
      });
    });
  }, []);

  const viewer = useQuery({
    queryKey: viewerKey(authUserId),
    queryFn: async () => {
      const found = await apiGet<Viewer>('/me');
      // Still the one signed in: put them in the store.
      if (useSessionStore.getState().signedIn) useSessionStore.setState({ viewer: found, viewerFailed: false });
      // Just joined: where they came from, sent once.
      sendFirstSource();
      return found;
    },
    enabled: Boolean(authUserId),
    staleTime: 60_000,
    meta: {
      onError: () => {
        useSessionStore.setState({ viewerFailed: true });
        // The sign in page says so itself.
        if (!window.location.pathname.startsWith('/signin')) {
          toast.error('We could not load your account. Check your connection and try again.');
        }
      },
    },
  });

  // Then what is theirs: none to load for a banned account, which sees only
  // its ban.
  useQuery({
    queryKey: [...viewerKey(authUserId), 'account'],
    queryFn: async () => {
      await loadAccountData();
      return true;
    },
    enabled: Boolean(viewer.data && viewer.data.standing !== 'banned'),
    staleTime: 30_000,
  });

  return null;
}
