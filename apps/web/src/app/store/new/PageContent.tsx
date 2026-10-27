'use client';

/**
 * Open a store: a short form, the store's name and where it is (docs/
 * product/accounts-and-stores.md). It opens as a free store, up to 15 live
 * listings for sale or swap, run from the person's own account; a pass and
 * the Verified store badge come later, when wanted. Reached from the listing
 * limit message and from Me.
 */

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_TOWN, TOWNS, useSessionStore, type Town } from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  Dropdown,
  Field,
  FieldRow,
  Footer,
  Panel,
  Screen,
  ScreenBody,
  SignInGate,
  Stack,
  startPageLoad,
} from '@snt/ui';
import { refreshStore } from '@/lib/refresh';
import { apiAsViewer, fetchViewer, supabase } from '@/lib/supabase';
import styles from './page.module.css';

const TOWN_OPTIONS = TOWNS.map((town) => ({ value: town, label: town }));

export default function OpenStorePage() {
  const router = useRouter();
  const townLabel = useId();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [town, setTown] = useState<Town>(DEFAULT_TOWN);
  const [busy, setBusy] = useState(false);

  async function open(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !area.trim()) {
      toast.error('Enter the store’s name and neighbourhood.');
      return;
    }
    setBusy(true);
    const { data, error } = await apiAsViewer<{ slug: string }>('/stores', {
      method: 'POST',
      body: { name: name.trim(), location: `${area.trim()}, ${town}` },
    });
    if (error || !data) {
      setBusy(false);
      toast.error(error ?? 'We could not open it. Try again in a minute.');
      return;
    }
    // Who they are now includes the store, for Post as and Me.
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (token) useSessionStore.setState({ viewer: await fetchViewer(token) });
    await refreshStore(data.slug);
    toast.success('Your store is open');
    startPageLoad();
    router.push(`/store/${data.slug}`);
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
                    A store has its own page and up to 15 live listings for sale or
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
                  <Button type="submit" size="lg" block loading={busy}>
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
      <Footer />
    </Screen>
  );
}
