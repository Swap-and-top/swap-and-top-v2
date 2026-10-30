/** One list on a user's record, in the Staff console's Users: their
    actions, reports about them, reports they sent or listings. See
    PageContent. */

import { notFound } from 'next/navigation';
import PageContent, { type ListName } from './PageContent';

export const metadata = { title: 'User · Swap & Top' };

/** The lists a user's page opens (kept here too: the page's own table of
    them lives in browser only code, which the server cannot read). */
const NAMES: ListName[] = ['actions', 'reports', 'sent', 'listings'];

export default async function Page({ params }: { params: Promise<{ id: string; list: string }> }) {
  const { id, list } = await params;
  if (!NAMES.includes(list as ListName)) notFound();
  return <PageContent id={id} list={list as ListName} />;
}
