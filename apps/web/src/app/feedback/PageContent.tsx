'use client';

/**
 * Send feedback, from the menu: one box and Send feedback, with no account
 * needed (POST /api/feedback). The page they came from goes with it
 * (`?from=`), and who they are if signed in, so our team can find how they
 * were using the site. Read in the Staff console's Feedback section.
 */

import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AppHeader, Button, ButtonLink, Screen, ScreenBody, Stack } from '@snt/ui';
import { publicSend } from '@/lib/query';
import styles from './page.module.css';

export default function FeedbackPage() {
  const from = useSearchParams().get('from') ?? undefined;
  const [message, setMessage] = useState('');
  const send = useMutation({
    mutationFn: () => publicSend('/feedback', { message: message.trim(), page: from }),
  });

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <div className={styles.card}>
          {send.isSuccess ? (
            <Stack gap={5}>
              <h1 className={styles.title}>Thank you</h1>
              <p className={styles.lead}>Your feedback is with our team. We read every message.</p>
              <ButtonLink href={from?.startsWith('/') ? from : '/'} size="lg" block>
                {from && from !== '/' ? 'Back to where I was' : 'Back to browse'}
              </ButtonLink>
            </Stack>
          ) : (
            <Stack gap={5}>
              <h1 className={styles.title}>Send feedback</h1>
              <p className={styles.lead}>
                Tell us what works, what does not, or what you would like to see. Our team reads every message.
              </p>
              <label className={styles.field}>
                <span className={styles.label}>Your feedback</span>
                <textarea
                  className={styles.textarea}
                  rows={6}
                  maxLength={2000}
                  placeholder="e.g. I could not find where to add more photos."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>
              {send.isError ? (
                <p className={styles.problem} role="alert">
                  {send.error.message}
                </p>
              ) : null}
              <Button
                size="lg"
                block
                disabled={!message.trim()}
                loading={send.isPending}
                onClick={() => send.mutate()}
              >
                Send feedback
              </Button>
            </Stack>
          )}
        </div>
      </ScreenBody>
    </Screen>
  );
}
