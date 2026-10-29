'use client';

/**
 * "Sign in successful", shown once the page they were going to is on the
 * screen, not while it is still on its way (the sign in page asks for it
 * with `toastOnArrival`).
 */

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

let pending = false;

/** Asks for the toast when the next page shows. */
export function toastOnArrival(): void {
  pending = true;
}

export function SignInToast() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pending || pathname === '/signin') return;
    pending = false;
    toast.success('Sign in successful');
  }, [pathname]);
  return null;
}
