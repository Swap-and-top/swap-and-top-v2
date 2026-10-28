'use client';

/** The Staff console's front door: straight to the first section the
    person may see. */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@snt/ui';
import { StaffPage } from './StaffPage';
import { useStaffSections } from './sections';

export default function StaffHome() {
  const router = useRouter();
  const sections = useStaffSections();
  const first = sections[0]?.href;
  useEffect(() => {
    if (first) router.replace(first);
  }, [first, router]);
  if (first) return null;
  return (
    <StaffPage title="Staff console">
      <EmptyState
        title="Nothing here for you yet"
        body="Your departments' sections are still being built. They will appear here as they are ready."
      />
    </StaffPage>
  );
}
