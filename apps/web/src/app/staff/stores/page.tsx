/** Stores: all stores and stores to call for Sales, and Verify stores for
    Trust and safety leaders. See PageContent. */

import PageContent from './PageContent';

export const metadata = { title: 'Stores · Swap & Top' };

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <PageContent initialTab={tab === 'verify' ? 'verify' : undefined} />;
}
