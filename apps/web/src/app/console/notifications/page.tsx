/**
 * The store's notifications, in the console (see PageContent).
 */

import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Notifications · Store console' };

export default function Page() {
  return <PageContent />;
}
