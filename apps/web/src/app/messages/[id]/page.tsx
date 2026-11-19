/** One chat (see PageContent). */

import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Messages · Swap & Top' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageContent id={id} />;
}
