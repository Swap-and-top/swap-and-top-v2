/**
 * Loading: a store's own page, its own, so My stores' skeleton does not
 * show while it comes.
 */

import { AppHeader, Bone, Screen, ScreenBody, Stack, SwapCardSkeleton, WantedCardSkeleton } from '@snt/ui';
import listStyles from '../../listings/page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader>
        <Bone width={200} height={26} />
      </AppHeader>
      <ScreenBody>
        <Stack gap={6}>
          <Bone width="70%" height={14} />
          <div className={listStyles.list}>
            <WantedCardSkeleton />
            <SwapCardSkeleton />
          </div>
        </Stack>
      </ScreenBody>
    </Screen>
  );
}
