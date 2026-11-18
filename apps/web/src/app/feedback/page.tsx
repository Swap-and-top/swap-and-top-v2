/** Send feedback: what a user wants to tell us. See PageContent. */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageContent from './PageContent';

export const metadata: Metadata = {
  title: 'Send feedback · Swap & Top',
  description: 'Tell the Swap & Top team what works, what does not, and what you would like.',
};

export default function Page() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
