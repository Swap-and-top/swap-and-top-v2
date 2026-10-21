'use client';

/**
 * A link to the feed that always lands on All: every category and every
 * type, whatever was picked last. The feed keeps its filters in the store
 * (see useFeedStore), so a plain link to "/" would bring them back.
 */

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useFeedStore } from '@snt/core';

export function HomeLink({
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'>) {
  return (
    <Link
      href="/"
      onClick={(event) => {
        useFeedStore.getState().reset();
        onClick?.(event);
      }}
      {...props}
    />
  );
}
