'use client';

/**
 * The Store console's gate: every console page is for one of the signed in
 * person's stores, and opens only while a store pass covers today
 * (docs/product/accounts-and-stores.md). Signed out, they are sent to sign
 * in; with no store, they are offered one; with a store but no pass, its
 * owner is offered one (staff are told to ask). Otherwise the console opens
 * for their store, the first with a pass, which the header and the pages read
 * (`useConsoleTarget`).
 */

import { useMemo, useState, type ReactNode } from 'react';
import { useSessionStore, type Store } from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  ConsoleTargetContext,
  EmptyState,
  Screen,
  ScreenBody,
  SignInGate,
  Stack,
} from '@snt/ui';
import { StorePassSheet } from '@/components/StorePassSheet';

/** "Kopje Computers" → "KC"; "Samora" → "SA", as the API makes them. */
function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word));
  const letters =
    words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? 'ST').slice(0, 2);
  return letters.toUpperCase();
}

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <SignInGate>
      <Gate>{children}</Gate>
    </SignInGate>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const viewer = useSessionStore((state) => state.viewer);
  const [buying, setBuying] = useState(false);
  // Their first store with a pass running; else their first store.
  const mine = viewer?.stores.find((s) => s.paidUntil) ?? viewer?.stores[0];

  const store = useMemo<Store | null>(
    () =>
      mine
        ? {
            id: mine.id,
            slug: mine.slug,
            name: mine.name,
            initials: initialsOf(mine.name),
            description: '',
            location: '',
            openingHours: '',
            verified: false,
            stockCount: 0,
            confirmedDeals: 0,
            replyHours: 1,
            joinedAt: '',
          }
        : null,
    [mine],
  );

  // Who they are comes from the API a moment after sign in.
  if (!viewer) return null;

  if (!mine || !store) {
    return (
      <Message
        title="The Store console is for stores"
        body="Open a store to run your stock, offers and leads here. Opening one is free."
        action={
          <ButtonLink href="/store/new" size="lg" block>
            Open a store
          </ButtonLink>
        }
      />
    );
  }

  if (!mine.paidUntil) {
    const owner = mine.role === 'owner';
    return (
      <>
        <Message
          title={`${mine.name} needs a store pass`}
          body={
            owner
              ? 'The Store console opens while a store pass runs: from $1 a day. A pass also lifts the listing limit and turns on lead alerts.'
              : 'The Store console opens while a store pass runs. Ask the store’s owner to get one.'
          }
          action={
            owner ? (
              <Button size="lg" block onClick={() => setBuying(true)}>
                Get a store pass
              </Button>
            ) : null
          }
        />
        {buying ? <StorePassSheet store={mine} onClose={() => setBuying(false)} /> : null}
      </>
    );
  }

  return (
    <ConsoleTargetContext.Provider value={store}>{children}</ConsoleTargetContext.Provider>
  );
}

/** Why the console is not open, with the way on and back to the marketplace. */
function Message({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <EmptyState
          title={title}
          body={body}
          action={
            <Stack gap={4}>
              {action}
              <ButtonLink href="/" variant="secondary" size="lg" block>
                Back to marketplace
              </ButtonLink>
            </Stack>
          }
        />
      </ScreenBody>
    </Screen>
  );
}
