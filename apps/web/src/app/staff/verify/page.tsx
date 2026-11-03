/** Verify stores is a tab of Stores now: an old link opens it there. */

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/staff/stores?tab=verify');
}
