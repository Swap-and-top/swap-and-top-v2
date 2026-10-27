/**
 * Sign up: a page of its own, reached from "Don't have an account? Sign up"
 * on the sign in page. Laid out as the sign in page.
 *
 * The server half only reads where to go afterwards, as sign in does.
 */

import { SignUpPage } from './SignUpPage';

export const metadata = { title: 'Sign up · Swap & Top' };

export default async function SignUpRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;
  const to = typeof next === 'string' && next.startsWith('/') ? next : '/';
  return <SignUpPage next={to} />;
}
