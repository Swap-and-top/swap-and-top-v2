/**
 * A person's notifications (see PageContent).
 */

import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Notifications · Swap & Top' };

export default function Page() {
  return <PageContent />;
}
