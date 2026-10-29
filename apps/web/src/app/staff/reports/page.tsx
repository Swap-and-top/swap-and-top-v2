/** Reports, in the Staff console: Trust and safety's queue. See
    PageContent. `?open=` opens one report straight away (from a person's
    record). */

import PageContent from './PageContent';

export const metadata = { title: 'Reports · Swap & Top' };

export default async function Page({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams;
  return <PageContent openFirst={open} />;
}
