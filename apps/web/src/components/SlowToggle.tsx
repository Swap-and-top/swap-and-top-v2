'use client';

/**
 * Turns slow mode on and off (see components/slowDown): with it on, each
 * page with a skeleton takes about three seconds to arrive, so its skeleton
 * can be seen. Only while developing.
 */

import { useEffect, useState } from 'react';
import { Button } from '@snt/ui';

const COOKIE = 'snt-slow';

export function SlowToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(document.cookie.split('; ').includes(`${COOKIE}=1`));
  }, []);

  function toggle() {
    const next = !on;
    document.cookie = next
      ? `${COOKIE}=1; path=/; max-age=86400`
      : `${COOKIE}=; path=/; max-age=0`;
    setOn(next);
  }

  return (
    <Button variant={on ? 'primary' : 'secondary'} block onClick={toggle}>
      {on ? 'Slow pages are on: turn off' : 'Slow pages: turn on'}
    </Button>
  );
}
