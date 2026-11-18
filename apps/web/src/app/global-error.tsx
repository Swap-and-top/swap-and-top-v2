'use client';

/**
 * What a user sees when the frame around every page breaks (the header,
 * sign in, and so on), which error.tsx cannot catch: it stands in for the
 * whole layout, so it brings its own page, styles and font. Try again loads
 * the page afresh.
 */

import { useEffect } from 'react';
import { Button, ButtonLink, EmptyState, Screen, ScreenBody, Stack } from '@snt/ui';
import { poppins } from './font';
import '@snt/ui/styles/tokens.css';
import '@snt/ui/styles/reset.css';
import './globals.css';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  // Not loading anything: the error goes to the console for us to find.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Screen>
          <ScreenBody>
            <EmptyState
              title="Something went wrong"
              body="Sorry, Swap & Top did not load properly. Try again, or go back to browse."
              action={
                <Stack gap={2}>
                  <Button size="lg" block onClick={() => window.location.reload()}>
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
      </body>
    </html>
  );
}
