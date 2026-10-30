/** Loading: Edit store details, in the page's own shape (see Skeleton). */

import { AppHeader, Bone, Screen, ScreenBody, Stack } from '@snt/ui';
import { StoreFormSkeleton } from './Skeleton';
import styles from './page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <Stack gap={6}>
          <h1 className={styles.title}>Edit store details</h1>
          <StoreFormSkeleton />
          <Bone shape="pill" height={44} />
        </Stack>
      </ScreenBody>
    </Screen>
  );
}
