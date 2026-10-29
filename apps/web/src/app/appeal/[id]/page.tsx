/** An action our team took on you, and your appeal. See PageContent. */

import PageContent from './PageContent';

export const metadata = { title: 'Our decision · Swap & Top' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageContent id={id} />;
}
