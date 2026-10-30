'use client';

/**
 * My stores, opened from Me: each store the person owns or works for, one
 * row each. A tap opens a store with a pass in its Store console (its
 * details and pass are there, not on Me); a free store, which has no
 * console, on its own page here (`[id]`), with its listings.
 */

import { useSessionStore } from '@snt/core';
import { AppHeader, ButtonLink, ListGroup, ListRow, Screen, ScreenBody, SignInGate, Stack } from '@snt/ui';
import { BoxIcon } from '@snt/ui/icons';
import styles from './page.module.css';

/** One empty list, so a guest's stores are the same each time they are read. */
const NO_STORES: never[] = [];

export default function MyStoresPage() {
  const stores = useSessionStore((state) => state.viewer?.stores ?? NO_STORES);

  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>My stores</h1>
      </AppHeader>

      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            {stores.length ? (
              <ListGroup>
                {stores.map((store) => (
                  <ListRow
                    key={store.id}
                    href={store.paidUntil ? `/console/stock?store=${store.id}` : `/me/stores/${store.id}`}
                    icon={<BoxIcon size={19} />}
                    label={store.name}
                    value={
                      store.paidUntil
                        ? `Paid until ${store.paidUntil}`
                        : store.role === 'owner'
                          ? 'Free store'
                          : 'Staff'
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <p className={styles.none}>You have no stores yet. Opening one is free.</p>
            )}
            <ButtonLink href="/me" variant="secondary" block>
              Back to my profile
            </ButtonLink>
          </Stack>
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
