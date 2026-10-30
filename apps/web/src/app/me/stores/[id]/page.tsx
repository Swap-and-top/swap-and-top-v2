/** One of the signed in person's stores, from My stores (see PageContent). */

import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'My store · Swap & Top' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageContent id={id} />;
}
