/**
 * The page (see PageContent), behind a server half that can hold its content
 * back in slow mode, so its loading skeleton can be seen (see slowDown).
 */

import { slowDown } from '@/components/slowDown';
import PageContent from './PageContent';

export default async function Page() {
  await slowDown();
  return <PageContent />;
}
