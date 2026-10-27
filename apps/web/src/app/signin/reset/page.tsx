/**
 * Choosing a new password: where the link in a "Forgot password?" email
 * lands. Laid out as the sign in page.
 */

import { ResetPage } from './ResetPage';

export const metadata = { title: 'New password · Swap & Top' };

export default function ResetRoute() {
  return <ResetPage />;
}
