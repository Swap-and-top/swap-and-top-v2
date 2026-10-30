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

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore, type Store } from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  ConsoleLeadCountContext,
  ConsoleShell,
  ConsoleTargetContext,
  EmptyState,
  Screen,
  ScreenBody,
  SignInGate,
  Stack,
} from '@snt/ui';
import { StorePassSheet } from '@/components/StorePassSheet';
import { useConsoleChoice } from '@/lib/consoleChoice';
import { storeLeadsQuery } from '@/lib/storeLeads';
import LeadsLoading from './leads/loading';
import StatsLoading from './stats/loading';
import StockLoading from './stock/loading';
import StoreLoading from './store/loading';
import OffersLoading from './trade-ins/loading';

/** Each page's own skeleton, by its address, to show from the very first
    moment: the same one the page shows while its data comes, so it all
    changes to the real page at once. */
const SKELETONS: Record<string, () => ReactNode> = {
  '/console/stock': StockLoading,
  '/console/leads': LeadsLoading,
  '/console/trade-ins': OffersLoading,
  '/console/stats': StatsLoading,
  '/console/store': StoreLoading,
};

/** "Kopje Computers" → "KC"; "Samora" → "SA", as the API makes them. */
function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word));
  const letters =
    words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? 'ST').slice(0, 2);
  return letters.toUpperCase();
}

/** No store yet, while who is signed in is still coming. */
const WAITING: Store = {
  id: '',
  slug: '',
  name: '',
  initials: '',
  description: '',
  location: '',
  openingHours: '',
  verified: false,
  stockCount: 0,
  confirmedDeals: 0,
  replyHours: 1,
  joinedAt: '',
};

/** While the sign in and who it is come: the page's own skeleton, or for a
    page without one the console's frame in bones; the store's name a bone
    too, as it is not known yet. Never a blank page. */
function Waiting() {
  const Skeleton = SKELETONS[usePathname() ?? ''];
  return (
    <ConsoleTargetContext.Provider value={WAITING}>
      {Skeleton ? <Skeleton /> : <ConsoleShell store={WAITING} title="">{null}</ConsoleShell>}
    </ConsoleTargetContext.Provider>
  );
}

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  const restored = useSessionStore((state) => state.restored);
  const signedIn = useSessionStore((state) => state.signedIn);
  // A remembered sign in comes back a moment after the page loads.
  if (!restored && !signedIn) return <Waiting />;
  return (
    <SignInGate>
      {/* The address is read as the page draws (useSearchParams), which
          asks for a Suspense boundary. */}
      <Suspense fallback={null}>
        <Gate>{children}</Gate>
      </Suspense>
    </SignInGate>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const viewer = useSessionStore((state) => state.viewer);
  const [buying, setBuying] = useState(false);
  const chosen = useConsoleChoice((state) => state.storeId);
  const choose = useConsoleChoice((state) => state.choose);

  // Opened from My stores for one store: `?store=<id>` chooses it. It is
  // read as the page draws, so the store chosen before never shows first,
  // and kept for the console's other pages.
  const asked = useSearchParams().get('store');
  useEffect(() => {
    if (asked) choose(asked);
  }, [asked, choose]);

  // The store asked for, or else they chose, if they are still in it; else
  // their first store with a pass running; else their first store.
  const mine =
    viewer?.stores.find((s) => s.id === asked) ??
    viewer?.stores.find((s) => s.id === chosen) ??
    viewer?.stores.find((s) => s.paidUntil) ??
    viewer?.stores[0];

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
            verified: mine.verified ?? false,
            stockCount: 0,
            confirmedDeals: 0,
            replyHours: 1,
            joinedAt: '',
          }
        : null,
    [mine],
  );

  // The store's leads, for the badge on Leads: how many are new. Only once
  // a pass covers it, as the console itself. The Leads page reads the same.
  const leads = useQuery({ ...storeLeadsQuery(mine?.id ?? ''), enabled: Boolean(mine?.paidUntil) });
  const newLeads = leads.data ? leads.data.filter((lead) => lead.isNew).length : 0;

  // Who they are comes from the API a moment after sign in.
  if (!viewer) return <Waiting />;

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
              <Stack gap={4}>
                <Button size="lg" block onClick={() => setBuying(true)}>
                  Get a store pass
                </Button>
                {/* A free store's details are edited from here too, now
                    that Me only lists the stores. */}
                <ButtonLink href={`/store/${mine.slug}/edit`} variant="secondary" size="lg" block>
                  Edit store details
                </ButtonLink>
              </Stack>
            ) : null
          }
        />
        {buying ? <StorePassSheet store={mine} onClose={() => setBuying(false)} /> : null}
      </>
    );
  }

  return (
    <ConsoleTargetContext.Provider value={store}>
      <ConsoleLeadCountContext.Provider value={newLeads}>{children}</ConsoleLeadCountContext.Provider>
    </ConsoleTargetContext.Provider>
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
              <ButtonLink href="/me" variant="secondary" size="lg" block>
                Back to my profile
              </ButtonLink>
            </Stack>
          }
        />
      </ScreenBody>
    </Screen>
  );
}
