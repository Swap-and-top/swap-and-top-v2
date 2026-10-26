/**
 * Promote is now part of Stats, at its foot: an old link lands there.
 */

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/console/stats');
}
