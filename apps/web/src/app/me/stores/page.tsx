/** The signed in person's stores, from Me (see PageContent). */

import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'My stores · Swap & Top' };

export default function Page() {
  return <PageContent />;
}
