'use client';

/**
 * The deal check page's body: the deal, found among the signed in person's
 * deal checks once the API has sent them (accountData). Until then nothing
 * is drawn; a deal they are not asked about, or that has gone, says so.
 */

import { useDealStore } from '@snt/core';
import { AppHeader, ButtonLink, EmptyState, Screen, ScreenBody, SignInGate } from '@snt/ui';
import { DealConfirm } from './DealConfirm';

export function DealConfirmRoute({ id }: { id: string }) {
  const loaded = useDealStore((state) => state.loaded);
  const deal = useDealStore((state) => state.deals.find((one) => one.id === id));

  if (deal) return <DealConfirm confirmation={deal} />;
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          {loaded ? (
            <EmptyState
              title="This deal check is not here"
              body="It may have been answered already, or it is not one you are asked about."
              action={<ButtonLink href="/me/deals">Back to deals</ButtonLink>}
            />
          ) : null}
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
