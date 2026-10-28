'use client';

/**
 * Saved: the listings someone has starred, to watch for a price drop or a
 * sale. Swaps and wanted posts too, not only things to buy.
 *
 * A reduced form of the same cards, with availability state and a price-drop
 * flag. A saved listing that has sold is dimmed and labelled rather than
 * removed, so the viewer understands what happened.
 *
 * Wireframe artboard: `Saved`.
 */

import { useEffect, useState } from 'react';
import {
  useSavedStore,
  useSessionStore,
  type Listing,
} from '@snt/core';
import {
  AppHeader,
  ButtonLink,
  CompactListingRow,
  CompactListingRowSkeleton,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenTitle,
  Stack,
  Tabs,
  TabsSkeleton,
  type TabItem,
  SignInGate,
} from '@snt/ui';
import { apiAsViewer } from '@/lib/supabase';

type SavedTab = 'all' | 'available' | 'gone';

function isGone(listing: Listing): boolean {
  return listing.status !== 'live' && listing.status !== 'draft';
}

export default function SavedPage() {
  const { ids } = useSavedStore();
  const [tab, setTab] = useState<SavedTab>('all');
  const viewerId = useSessionStore((state) => state.viewer?.id);
  /** The saved listings themselves, from the API (GET /api/me/saved); null
      until it answers, while the page shows its skeleton rather than
      "Nothing saved yet". */
  const [listings, setListings] = useState<Listing[] | null>(null);

  useEffect(() => {
    if (!viewerId) return;
    let current = true;
    void apiAsViewer<{ listings: Listing[] }>('/me/saved', { method: 'GET' }).then(({ data }) => {
      if (current) setListings(data?.listings ?? []);
    });
    return () => {
      current = false;
    };
  }, [viewerId]);

  // In the order saved, newest first; one unsaved here leaves at once.
  const saved = ids
    .map((id) => listings?.find((listing) => listing.id === id))
    .filter((listing): listing is Listing => listing !== undefined);

  const available = saved.filter((listing) => !isGone(listing));
  const gone = saved.filter(isGone);

  const tabs: TabItem<SavedTab>[] = [
    { value: 'all', label: 'All', count: saved.length },
    { value: 'available', label: 'Available', count: available.length },
    { value: 'gone', label: 'Gone', count: gone.length },
  ];

  const shown =
    tab === 'available' ? available : tab === 'gone' ? gone : saved;

  return (
    <Screen>
      <AppHeader>
        <ScreenTitle>Saved</ScreenTitle>
        {/* While the saved listings load: the page's own skeleton, as
            loading.tsx has it. */}
        {listings === null ? (
          <TabsSkeleton widths={[40, 76, 54]} />
        ) : (
          <Tabs tabs={tabs} active={tab} onChange={setTab} label="Saved" />
        )}
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          {listings === null ? (
            <Stack gap={5}>
              {Array.from({ length: 4 }).map((_, i) => (
                <CompactListingRowSkeleton key={i} />
              ))}
            </Stack>
          ) : shown.length > 0 ? (
            <Stack gap={5}>
              {shown.map((listing) => (
                <CompactListingRow key={listing.id} listing={listing} />
              ))}
            </Stack>
          ) : (
            <EmptyState
              title="Nothing saved yet"
              body="Tap the star on any listing to keep it here. You will be told when the price drops."
              action={<ButtonLink href="/" variant="secondary">Browse listings</ButtonLink>}
            />
          )}
        </SignInGate>
      </ScreenBody>

    </Screen>
  );
}
