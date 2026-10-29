/** One person's record, in the Staff console's People. See PageContent. */

import PageContent from './PageContent';

export const metadata = { title: 'Person · Swap & Top' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageContent id={id} />;
}
