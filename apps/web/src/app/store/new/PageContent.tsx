'use client';

/**
 * Open a store: a short form, the store's name and where it is (docs/
 * product/accounts-and-stores.md). It opens as a free store, up to 5 live
 * listings for sale or swap, run from the person's own account; a pass and
 * the Verified store badge come later, when wanted. Reached from the listing
 * limit message and from Me.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_TOWN, FREE_STORE_LIMIT, TOWNS, type Category, type Town } from '@snt/core';
import { StoreCategories } from '@/components/StoreCategories';
import {
  AppHeader,
  Button,
  ButtonLink,
  Dropdown,
  Field,
  FieldRow,
  Panel,
  Screen,
  ScreenBody,
  SignInGate,
  Stack,
  startPageLoad,
} from '@snt/ui';
import { refreshStore } from '@/lib/refresh';
import { apiSend } from '@/lib/query';
import { refreshViewer } from '@/lib/viewer';
import styles from './page.module.css';

const TOWN_OPTIONS = TOWNS.map((town) => ({ value: town, label: town }));

export default function OpenStorePage() {
  const router = useRouter();
  const townLabel = useId();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [town, setTown] = useState<Town>(DEFAULT_TOWN);
  /** What it sells: none until chosen, at least one needed. */
  const [categories, setCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();

  const openStore = useMutation({
    mutationFn: async () => {
      const data = await apiSend<{ id: string; slug: string }>('/stores', 'POST', {
        name: name.trim(),
        location: `${area.trim()}, ${town}`,
        categories,
      });
      // Who they are now includes the store, for Post as and Me.
      await refreshViewer(queryClient);
      await refreshStore(data.slug);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Your store is open');
      startPageLoad();
      // To the owner's page for it, where they add their first item and
      // share its link, not the page buyers see.
      router.push(`/me/stores/${data.id}`);
    },
    onError: (error) => toast.error(error.message || 'We could not open it. Try again in a minute.'),
  });

  function open(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !area.trim()) {
      toast.error('Enter the store’s name and neighbourhood.');
      return;
    }
    if (categories.length === 0) {
      toast.error('Choose what the store sells.');
      return;
    }
    openStore.mutate();
  }

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <h1 className={styles.title}>Open a store</h1>
            <Panel padded>
              <form onSubmit={open}>
                <Stack gap={5}>
                  <p className={styles.lead}>
                    A store has its own page and up to {FREE_STORE_LIMIT} live listings for sale or
                    swap. It is free, and you run it from your own account.
                  </p>
                  <Field
                    label="Store name"
                    placeholder="e.g. Avondale Games"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <FieldRow>
                    <Field
                      label="Neighbourhood"
                      placeholder="e.g. Avondale"
                      value={area}
                      onChange={(event) => setArea(event.target.value)}
                    />
                    <div className={styles.town}>
                      <span id={townLabel} className={styles.label}>
                        City or town
                      </span>
                      <Dropdown
                        value={town}
                        options={TOWN_OPTIONS}
                        onChange={setTown}
                        labelledBy={townLabel}
                      />
                    </div>
                  </FieldRow>
                  <StoreCategories value={categories} onChange={setCategories} />
                  <Button type="submit" size="lg" block loading={openStore.isPending}>
                    Open store
                  </Button>
                </Stack>
              </form>
            </Panel>
            <ButtonLink href="/me" variant="secondary" block>
              Cancel
            </ButtonLink>
          </Stack>
        </SignInGate>
      </ScreenBody>
    </Screen>
  );
}
