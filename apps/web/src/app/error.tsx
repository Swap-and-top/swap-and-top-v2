'use client';

/**
 * What a user sees when a page breaks: a plain apology and two ways on,
 * under the usual header, never the browser's own error text. A break in
 * the frame around every page has its own (global-error.tsx).
 */

import { useEffect } from 'react';
import { AppHeader, Button, ButtonLink, EmptyState, Screen, ScreenBody, Stack } from '@snt/ui';

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Not loading anything: the error goes to the console for us to find.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <EmptyState
          title="Something went wrong"
          body="Sorry, this page did not load properly. Try again, or go back to browse."
          action={
            <Stack gap={2}>
              <Button size="lg" block onClick={reset}>
                Try again
              </Button>
              <ButtonLink href="/" variant="secondary" size="lg" block>
                Back to browse
              </ButtonLink>
            </Stack>
          }
        />
      </ScreenBody>
    </Screen>
  );
}
