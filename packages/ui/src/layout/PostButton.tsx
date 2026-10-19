'use client';

/**
 * PostButton — "Post New Item" in the header.
 *
 * Posting needs an account. Someone signed in goes straight to the posting
 * flow; a guest is asked to sign in first, and is taken there once they have.
 * Still a real link, so it can be opened in a new tab or read by a crawler.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { requireSignIn, useSessionStore } from '@snt/core';
import { startPageLoad } from '../pageLoad';

export function PostButton({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const signedIn = useSessionStore((state) => state.signedIn);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Signed in, or opening in a new tab or window: an ordinary link.
    if (signedIn || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    requireSignIn('Sign in to post a listing.', () => {
      startPageLoad();
      router.push(href);
    });
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      // A guest's tap opens the sign in sheet and stays on the page, so the
      // top loading bar is told not to start; it starts once they are in.
      data-no-page-load={signedIn ? undefined : ''}
    >
      {children}
    </Link>
  );
}
