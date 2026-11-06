'use client';

/** Loading: Edit store details, in the page's own shape (see Skeleton), with
    the two logo buttons when the store has a logo, as the form will. */

import { useParams } from 'next/navigation';
import { useSessionStore } from '@snt/core';
import { AppHeader, Bone, Screen, ScreenBody, Stack } from '@snt/ui';
import { StoreFormSkeleton } from './Skeleton';
import styles from './page.module.css';

export default function Loading() {
  const { slug } = useParams<{ slug: string }>();
  const logo = useSessionStore((state) =>
    Boolean(state.viewer?.stores.find((store) => store.slug === slug)?.logo),
  );
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <Stack gap={6}>
          <h1 className={styles.title}>Edit store details</h1>
          <StoreFormSkeleton logo={logo} />
          <Bone shape="pill" height={44} />
        </Stack>
      </ScreenBody>
    </Screen>
  );
}
