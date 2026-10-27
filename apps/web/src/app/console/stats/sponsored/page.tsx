/**
 * The shop's sponsored items (see PageContent). Reached from Stats.
 */

import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Sponsored items · Dealer console' };

export default function Page() {
  return <PageContent />;
}
