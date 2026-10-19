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

import { useState } from 'react';
import {
  getListing,
  useSavedStore,
  type Listing,
} from '@snt/core';
import {
  AppHeader,
  ButtonLink,
  CompactListingRow,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenTitle,
  Stack,
  Tabs,
  type TabItem,
  SignInGate,
} from '@snt/ui';

type SavedTab = 'all' | 'available' | 'gone';

function isGone(listing: Listing): boolean {
  return listing.status !== 'live' && listing.status !== 'draft';
}

export default function SavedPage() {
  const { ids } = useSavedStore();
  const [tab, setTab] = useState<SavedTab>('all');

  const saved = ids
    .map((id) => getListing(id))
    .filter((listing): listing is Listing => listing !== undefined);

  const available = saved.filter((listing) => !isGone(listing));
  const gone = saved.filter(isGone);

  const tabs: TabItem<SavedTab>[] = [
    { value: 'all', label: `All ${saved.length}` },
    { value: 'available', label: `Available ${available.length}` },
    { value: 'gone', label: `Gone ${gone.length}` },
  ];

  const shown =
    tab === 'available' ? available : tab === 'gone' ? gone : saved;

  return (
    <Screen>
      <AppHeader>
        <ScreenTitle>Saved</ScreenTitle>
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Saved" />
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          {shown.length > 0 ? (
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
