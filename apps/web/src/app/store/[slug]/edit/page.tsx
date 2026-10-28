/** Edit store details: the owner's form. See PageContent. */

import PageContent from './PageContent';

export const metadata = { title: 'Edit store details · Swap & Top' };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PageContent slug={slug} />;
}
