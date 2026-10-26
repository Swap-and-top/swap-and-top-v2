/**
 * The page (see PageContent), behind a server half that can hold its content
 * back in slow mode, so its loading skeleton can be seen (see slowDown).
 */

import type { Metadata } from 'next';
import { slowDown } from '@/components/slowDown';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Deals to confirm · Swap & Top' };

export default async function Page() {
  await slowDown();
  return <PageContent />;
}
