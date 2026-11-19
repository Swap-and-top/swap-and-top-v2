/** Messages: the user's chats (see PageContent). */

import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Messages · Swap & Top' };

export default function Page() {
  return <PageContent />;
}
