'use client';

/**
 * PostButton — "Post New Item" in the header — and `useSignInToPost`, the
 * same rule for any other link into the posting flow (the feed's and
 * search's "Post what you're looking for", the Wanted page's prompt).
 *
 * Posting needs an account. Someone signed in goes straight to the posting
 * flow; a guest is asked to sign in first, and is taken there once they have.
 * Still a real link, so it can be opened in a new tab or read by a crawler.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { requireVerifiedPhone, useSessionStore } from '@snt/core';
import { startPageLoad } from '../pageLoad';

/**
 * For a link into the posting flow: what to spread on it. A guest's tap
 * opens the sign in sheet instead, and someone without a verified phone the
 * verify phone sheet, and stays on the page, so the top loading
 * bar is told not to start; it starts once they are in. `then` runs as the
 * move to posting happens (e.g. clearing the feed's filters), not while a
 * guest is still deciding whether to sign in.
 */
export function useSignInToPost(href: string, then?: () => void) {
  const router = useRouter();
  const signedIn = useSessionStore((state) => state.signedIn);
  const phoneVerified = useSessionStore((state) => state.viewer?.phoneVerified ?? true);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Signed in with a verified phone, or opening in a new tab or window: an
    // ordinary link.
    if ((signedIn && phoneVerified) || event.metaKey || event.ctrlKey || event.shiftKey) {
      then?.();
      return;
    }
    event.preventDefault();
    requireVerifiedPhone(
      { signIn: 'Sign in to post a listing.', phone: 'Verify your phone number to post listings.' },
      () => {
        then?.();
        startPageLoad();
        router.push(href);
      },
    );
  }

  return {
    onClick,
    // A sheet opens instead of a page: no loading bar.
    'data-no-page-load': signedIn && phoneVerified ? undefined : '',
  };
}

export function PostButton({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const gate = useSignInToPost(href);
  return (
    <Link href={href} className={className} {...gate}>
      {children}
    </Link>
  );
}
