'use client';

/**
 * Keeps the session store in step with Supabase Auth. Supabase brings back a
 * remembered sign in as the app loads, and says whenever someone signs in or
 * out; each time, the store is told, and the API is asked who it is (see
 * useSessionStore in @snt/core).
 */

import { useEffect, useLayoutEffect } from 'react';
import { useSessionStore } from '@snt/core';
import { fetchViewer, supabase } from '@/lib/supabase';

export function SessionRestore() {
  // Before the first paint: if Supabase has a session saved in this browser,
  // draw signed in straight away rather than flashing the signed out page.
  useLayoutEffect(() => {
    try {
      // The old stand in session, from before real sign in.
      localStorage.removeItem('snt-session');
      const saved = Object.keys(localStorage).some(
        (key) => key.startsWith('sb-') && key.endsWith('-auth-token'),
      );
      if (saved) useSessionStore.setState({ signedIn: true });
    } catch {
      // No storage: Supabase will say soon enough.
    }
  }, []);

  useEffect(() => {
    useSessionStore.setState({
      signOut: () => void supabase.auth.signOut(),
    });

    /** The Supabase user the viewer was fetched for. */
    let authUserId: string | undefined;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        authUserId = undefined;
        useSessionStore.setState({
          signedIn: false,
          viewer: null,
          restored: true,
          ...(event === 'SIGNED_OUT' ? { signedOutAt: Date.now() } : {}),
        });
        return;
      }
      // Someone else signing in: drop the last name until the API answers.
      const changed = session.user.id !== authUserId;
      authUserId = session.user.id;
      useSessionStore.setState({
        signedIn: true,
        restored: true,
        ...(changed ? { viewer: null } : {}),
      });
      // Only when the person changes, not on every token refresh. Run after
      // this callback, as Supabase asks.
      if (!changed && useSessionStore.getState().viewer) return;
      const token = session.access_token;
      window.setTimeout(async () => {
        const viewer = await fetchViewer(token).catch(() => null);
        if (useSessionStore.getState().signedIn) useSessionStore.setState({ viewer });
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return null;
}
