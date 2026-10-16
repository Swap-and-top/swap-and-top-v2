/**
 * Sign in — a page of its own, reached from the header's "Sign in".
 *
 * Laid out as the first app's log-in page was: on a phone, one card — the
 * 3D door, "Sign in to Swap & Top", the details, then the ways in; from
 * tablet up, the card sits on the brand gradient beside "Sign in to Swap &
 * Top" in large white type and the 3D door and logo. Called "sign in"
 * throughout the app, never "log in".
 *
 * The server half only reads where to go afterwards, so the page can send the
 * visitor back to what they were doing.
 */

import { SignInPage } from './SignInPage';

export const metadata = { title: 'Sign in · Swap & Top' };

export default async function SignInRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;
  const to = typeof next === 'string' && next.startsWith('/') ? next : '/';
  return <SignInPage next={to} />;
}
