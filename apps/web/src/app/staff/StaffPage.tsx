'use client';

/** One page of the Staff console: its frame, with the sections of the
    person's departments and their name at the head. */

import type { ReactNode } from 'react';
import { useSessionStore, viewerName } from '@snt/core';
import { StaffShell } from '@snt/ui';
import { useStaffSections } from './sections';

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return letters.toUpperCase() || 'SN';
}

export function StaffPage({
  title,
  meta,
  actions,
  children,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const sections = useStaffSections();
  const loading = useSessionStore((state) => state.viewer === null);
  const name = useSessionStore((state) => (state.viewer ? viewerName(state.viewer) : ''));
  return (
    <StaffShell
      sections={sections}
      loading={loading}
      name={name}
      initials={loading ? '' : initialsOf(name)}
      title={title}
      meta={meta}
      actions={actions}
    >
      {children}
    </StaffShell>
  );
}
