'use client';

/**
 * Loading: Saved. The heading is the page's own; the tabs, which carry
 * counts, as bars; then Saved's rows in bones. Signed out, the page shows the
 * sign in prompt instead, and so does this.
 */

import {
  AppHeader,
  BottomNav,
  CompactListingRowSkeleton,
  Screen,
  ScreenBody,
  ScreenTitle,
  SignInGate,
  Stack,
  TabsSkeleton,
} from '@snt/ui';

export default function Loading() {
  return (
    <Screen>
      <AppHeader>
        <ScreenTitle>Saved</ScreenTitle>
        <TabsSkeleton widths={[40, 76, 54]} />
      </AppHeader>

      <ScreenBody>
        <SignInGate
          title="Your saved listings"
          body="Sign in to keep the listings you star in one place, and to be told when a price drops."
          reason="Sign in to see your saved listings."
        >
          <Stack gap={5}>
            {Array.from({ length: 4 }).map((_, i) => (
              <CompactListingRowSkeleton key={i} />
            ))}
          </Stack>
        </SignInGate>
      </ScreenBody>

      <BottomNav />
    </Screen>
  );
}
