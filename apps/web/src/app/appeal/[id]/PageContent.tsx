'use client';

/**
 * An action our team took on the signed in person (GET /api/me/actions/{id}),
 * reached from its notification: what was decided and why, and a box to
 * appeal it once, in their own words (POST /api/me/actions/{id}/appeal).
 * Once appealed it shows where the appeal stands, and the outcome.
 *
 * For a banned account it is the only page there is (BannedGate), with
 * Sign out in place of Back to notifications. `waiting` while the API has
 * not yet said which ban it is. Loaded and sent through TanStack Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { REPORT_REASON_LABELS, useSessionStore, type ReportReason } from '@snt/core';
import {
  AppHeader,
  Bone,
  Button,
  ButtonLink,
  Footer,
  Panel,
  Screen,
  ScreenBody,
  SignInGate,
  Stack,
} from '@snt/ui';
import { ApiError, apiGet, apiSend, QueryProblem } from '@/lib/query';
import styles from './page.module.css';

interface MyAction {
  kind: 'warning' | 'removal' | 'suspension' | 'ban';
  reason: ReportReason;
  dateLabel: string;
  listingTitle?: string;
  untilLabel?: string;
  reversed: boolean;
  appeal: { state: 'waiting' | 'upheld' | 'overturned'; statement: string; reason?: string } | null;
}

function decided(action: MyAction): string {
  switch (action.kind) {
    case 'warning':
      return 'A warning on your account';
    case 'removal':
      return `Your listing ${action.listingTitle ?? ''} was removed`;
    case 'suspension':
      return `Your account was suspended until ${action.untilLabel ?? ''}`;
    case 'ban':
      return 'Your account was banned';
  }
}

export default function AppealPage({
  id,
  banned = false,
  waiting = false,
}: {
  id?: string;
  banned?: boolean;
  waiting?: boolean;
}) {
  const signOut = useSessionStore((state) => state.signOut);
  const signedIn = useSessionStore((state) => state.signedIn);
  const [statement, setStatement] = useState('');
  const queryClient = useQueryClient();
  const key = ['me', 'action', id] as const;
  const loaded = useQuery({
    queryKey: key,
    queryFn: () => apiGet<MyAction>(`/me/actions/${encodeURIComponent(id!)}`),
    enabled: Boolean(id) && signedIn,
  });
  const action = loaded.data;
  /** Not theirs, or no such decision; or no ban to show a banned account. */
  const missing = (!id && !waiting) || (loaded.error instanceof ApiError && loaded.error.status === 404);

  const send = useMutation({
    mutationFn: () =>
      apiSend<MyAction>(`/me/actions/${encodeURIComponent(id!)}/appeal`, 'POST', { statement: statement.trim() }),
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      toast.success('Appeal sent.');
    },
    onError: (error) => toast.error(error.message),
  });

  const bottomButton = banned ? (
    <Button variant="secondary" block onClick={signOut}>
      Sign out
    </Button>
  ) : (
    <ButtonLink href="/notifications" variant="secondary" block>
      Back to notifications
    </ButtonLink>
  );

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <h1 className={styles.title}>{banned ? 'Your account is banned' : 'Our decision'}</h1>
            {missing ? (
              <>
                <Panel padded>
                  <p className={styles.lead}>
                    {banned ? 'You cannot use Swap & Top with this account.' : 'This decision is not on your account.'}
                  </p>
                </Panel>
                {banned ? (
                  <Button variant="secondary" block onClick={signOut}>
                    Sign out
                  </Button>
                ) : null}
              </>
            ) : loaded.isError ? (
              <QueryProblem error={loaded.error} onRetry={() => void loaded.refetch()} />
            ) : !action ? (
              // The same shapes as the decision and the appeal box, so
              // nothing moves when they arrive.
              <>
                <Panel padded>
                  <Stack gap={4}>
                    <Bone width={220} height={20} />
                    <Bone width="45%" height={17} />
                  </Stack>
                </Panel>
                <Panel padded>
                  <Stack gap={5}>
                    <Bone width={200} height={20} />
                    {/* "You can appeal once…", two lines on a phone. */}
                    <div className={styles.boneLines}>
                      <Bone width="80%" height={12} />
                      <Bone width="45%" height={12} className={styles.phoneOnly} />
                    </div>
                    <div className={styles.field}>
                      <Bone width={120} height={16} style={{ marginLeft: 'var(--snt-space-8)' }} />
                      <Bone height={95} shape="block" style={{ borderRadius: 22 }} />
                    </div>
                    <Bone height={48} shape="pill" />
                  </Stack>
                </Panel>
                {bottomButton}
              </>
            ) : (
              <>
                <Panel padded>
                  <Stack gap={4}>
                    <h2 className={styles.heading}>{decided(action)}</h2>
                    <p className={styles.lead}>
                      On {action.dateLabel}, for: {REPORT_REASON_LABELS[action.reason].toLowerCase()}.
                      {action.reversed ? ' It has since been overturned.' : ''}
                    </p>
                  </Stack>
                </Panel>

                {action.appeal ? (
                  <Panel padded>
                    <Stack gap={4}>
                      <h2 className={styles.heading}>
                        {action.appeal.state === 'waiting'
                          ? 'Your appeal is with our team'
                          : action.appeal.state === 'overturned'
                            ? 'Your appeal was successful'
                            : 'The decision stands'}
                      </h2>
                      {action.appeal.reason ? <p className={styles.lead}>{action.appeal.reason}</p> : null}
                      <p className={styles.quote}>{action.appeal.statement}</p>
                      {action.appeal.state === 'waiting' ? (
                        <p className={styles.lead}>
                          We have received your appeal. Someone on our team who did not make this decision will
                          check it within 24 to 48 hours. Whether the decision is overturned or stands, we will
                          tell you here and by email, so check back here and in your email after that.
                        </p>
                      ) : null}
                    </Stack>
                  </Panel>
                ) : action.reversed ? null : (
                  <Panel padded>
                    <Stack gap={5}>
                      <h2 className={styles.heading}>Think this was wrong?</h2>
                      <p className={styles.lead}>
                        You can appeal once. Someone on our team who did not make this decision looks at it.
                      </p>
                      <label className={styles.field}>
                        <span className={styles.label}>Why it was wrong</span>
                        <textarea
                          className={styles.textarea}
                          rows={4}
                          maxLength={1000}
                          placeholder="e.g. The phone is mine, and I have the receipt."
                          value={statement}
                          onChange={(event) => setStatement(event.target.value)}
                        />
                      </label>
                      <Button size="lg" block loading={send.isPending} disabled={statement.trim().length < 10} onClick={() => send.mutate()}>
                        Send appeal
                      </Button>
                    </Stack>
                  </Panel>
                )}
                {bottomButton}
              </>
            )}
          </Stack>
        </SignInGate>
      </ScreenBody>
      <Footer />
    </Screen>
  );
}
