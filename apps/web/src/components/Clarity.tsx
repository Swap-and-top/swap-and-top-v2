'use client';

/**
 * Microsoft Clarity: recordings of how users move through the site, and
 * heatmaps of where they tap, so we can watch how the first users get on
 * rather than only hear about it. Loaded only where
 * NEXT_PUBLIC_CLARITY_PROJECT_ID is set (production), so localhost and
 * staging record nothing.
 *
 * Kept out of the recordings: everything typed (Clarity masks inputs by
 * itself), and whatever sits inside `data-clarity-mask="true"`: the Staff
 * console, a seller's revealed contacts, a store's Leads and Settings.
 * A signed in user is named to Clarity by their account id only, never
 * their name, number or email, so a recording can be matched to them.
 */

import Script from 'next/script';
import { useEffect } from 'react';
import { useSessionStore } from '@snt/core';

const RAW = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? '';
/** The project's id, only if it looks like one (it is put in a script). */
const PROJECT = /^[a-z0-9]{6,20}$/i.test(RAW) ? RAW : null;

type ClarityCall = (...args: unknown[]) => void;

export function Clarity() {
  const viewerId = useSessionStore((state) => state.viewer?.id);

  // Not loading anything: tells Clarity whose session this is, once known.
  useEffect(() => {
    const clarity = (window as unknown as { clarity?: ClarityCall }).clarity;
    if (PROJECT && viewerId && clarity) clarity('identify', viewerId);
  }, [viewerId]);

  if (!PROJECT) return null;
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${PROJECT}");`}
    </Script>
  );
}
