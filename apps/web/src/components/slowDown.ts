/**
 * Slow mode, for looking at the loading skeletons: while it is switched on
 * (from /reference/skeletons, which sets the `snt-slow` cookie), every page
 * that has a skeleton waits about three seconds before its content arrives,
 * so the skeleton stays on screen. The skeleton itself is sent at once.
 *
 * Only while developing: on the live site this returns straight away and
 * never reads the cookie, so pages stay as fast and as cacheable as before.
 */

const DELAY_MS = 3000;

export async function slowDown(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  // Loaded here, on the server only, so the live build never touches it.
  const { cookies } = await import('next/headers');
  if ((await cookies()).get('snt-slow')?.value !== '1') return;
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}
