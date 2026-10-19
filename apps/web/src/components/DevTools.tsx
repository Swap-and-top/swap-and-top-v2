'use client';

/**
 * Developer tools, on the account page: the reference pages and the slow
 * mode switch in reach, without typing their addresses. Only while running
 * the app on your own computer; on the live site this shows nothing.
 */

import { ListGroup, ListRow } from '@snt/ui';
import { GridIcon, ListIcon } from '@snt/ui/icons';
import { SlowToggle } from './SlowToggle';

export function DevTools({ headingClassName }: { headingClassName?: string }) {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <>
      <h2 className={headingClassName}>Developer tools</h2>
      <ListGroup>
        <ListRow
          href="/reference/skeletons"
          icon={<ListIcon size={19} />}
          label="Loading skeletons"
        />
        <ListRow
          href="/reference/cards"
          icon={<GridIcon size={19} />}
          label="Card reference"
        />
      </ListGroup>
      <SlowToggle />
    </>
  );
}
