'use client';

/**
 * Appeals, a section of the Staff console, for Trust and safety leads: the
 * appeals waiting, oldest first (GET /api/staff/appeals), leaving out
 * decisions this lead made. Each shows what was decided, by whom, and the
 * person's own words. Uphold or Overturn, with a reason they are told
 * (POST /api/staff/appeals/{id}); overturning undoes the action and keeps
 * its record.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { REPORT_REASON_LABELS, type ReportReason } from '@snt/core';
import { Bone, Button, ButtonLink, Panel, Sheet, Stack } from '@snt/ui';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import styles from '../users/page.module.css';

interface Waiting {
  id: string;
  person: { id: string; name: string };
  kind: 'warning' | 'removal' | 'suspension' | 'ban';
  reason: ReportReason;
  listingTitle?: string;
  note?: string;
  decidedBy: string;
  decidedLabel: string;
  fromReport: boolean;
  statement: string;
  agoLabel: string;
}

const KIND_LABEL = {
  warning: 'Warning',
  removal: 'Listing removed',
  suspension: 'Suspended for 7 days',
  ban: 'Banned',
} as const;

type Outcome = 'upheld' | 'overturned';

export default function AppealsPage() {
  const lead = useInDepartment('trust_safety', true);
  /** The appeal being decided, and which way, while the reason is asked. */
  const [deciding, setDeciding] = useState<{ appeal: Waiting; outcome: Outcome } | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const waiting = useQuery({
    queryKey: staffKeys.appeals,
    queryFn: () => apiGet<{ appeals: Waiting[] }>('/staff/appeals').then((data) => data.appeals),
    enabled: lead === true,
  });
  const appeals = waiting.data;

  const decide = useMutation({
    mutationFn: ({ appeal, outcome }: { appeal: Waiting; outcome: Outcome }) =>
      apiSend(`/staff/appeals/${encodeURIComponent(appeal.id)}`, 'POST', { outcome, reason: reason.trim() }),
    onSuccess: (_, { appeal, outcome }) => {
      queryClient.setQueryData<Waiting[]>(staffKeys.appeals, (list) => list?.filter((item) => item.id !== appeal.id));
      // What it changed elsewhere: the counts, the log and their record.
      void queryClient.invalidateQueries({ queryKey: staffKeys.counts });
      void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
      void queryClient.invalidateQueries({ queryKey: staffKeys.user(appeal.person.id) });
      setDeciding(null);
      setReason('');
      toast.success(
        outcome === 'overturned'
          ? `Overturned. ${appeal.person.name} has been told, and it is undone.`
          : `Upheld. ${appeal.person.name} has been told.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <StaffPage title="Appeals" meta="Users asking us to look again, oldest first">
      <Stack gap={6}>
        {lead === false ? (
          <Panel padded>
            <p className={styles.lead}>Only Trust and safety leaders decide appeals.</p>
          </Panel>
        ) : waiting.isError ? (
          <QueryProblem error={waiting.error} onRetry={() => void waiting.refetch()} />
        ) : !appeals ? (
          <Panel padded>
            <Stack gap={5}>
              <Bone width={180} height={22} />
              <Bone height={70} />
              <Bone shape="pill" height={44} />
            </Stack>
          </Panel>
        ) : appeals.length === 0 ? (
          <Panel padded>
            <p className={styles.lead}>No appeals are waiting.</p>
          </Panel>
        ) : (
          appeals.map((appeal) => (
            <Panel padded key={appeal.id}>
              <Stack gap={5}>
                <h2 className={styles.name}>{appeal.person.name}</h2>
                <dl className={styles.facts}>
                  <dt>Decided</dt>
                  <dd>
                    {KIND_LABEL[appeal.kind]}
                    {appeal.listingTitle ? `, ${appeal.listingTitle}` : ''}
                  </dd>
                  <dt>Reason</dt>
                  <dd>{REPORT_REASON_LABELS[appeal.reason]}</dd>
                  <dt>By</dt>
                  <dd>
                    {appeal.decidedBy} on {appeal.decidedLabel}
                    {appeal.fromReport ? ', from a report' : ''}
                  </dd>
                  {appeal.note ? (
                    <>
                      <dt>Why it was decided</dt>
                      <dd>{appeal.note}</dd>
                    </>
                  ) : null}
                  <dt>Appealed</dt>
                  <dd>{appeal.agoLabel}</dd>
                </dl>
                <p className={styles.lead}>“{appeal.statement}”</p>
                <ButtonLink href={`/staff/users/${encodeURIComponent(appeal.person.id)}`} variant="secondary" block>
                  View their record
                </ButtonLink>
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={() => setDeciding({ appeal, outcome: 'upheld' })}>
                    Uphold
                  </Button>
                  <Button onClick={() => setDeciding({ appeal, outcome: 'overturned' })}>Overturn</Button>
                </div>
              </Stack>
            </Panel>
          ))
        )}
        {deciding ? (
          <Sheet
            narrow
            title={deciding.outcome === 'overturned' ? 'Overturn the decision' : 'Uphold the decision'}
            onClose={() => setDeciding(null)}
          >
            <Stack gap={4}>
              <p className={styles.lead}>
                {deciding.outcome === 'overturned'
                  ? `It is undone for ${deciding.appeal.person.name}, and stays on record as overturned. Tell them why.`
                  : `It stays as it is. Tell ${deciding.appeal.person.name} why.`}
              </p>
              <textarea
                className={styles.textarea}
                rows={3}
                maxLength={500}
                placeholder={
                  deciding.outcome === 'overturned'
                    ? 'e.g. The receipt shows the phone is yours.'
                    : 'e.g. The photos match another seller’s listing.'
                }
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <Button
                size="lg"
                block
                disabled={reason.trim().length < 2}
                loading={decide.isPending}
                onClick={() => decide.mutate(deciding)}
              >
                {deciding.outcome === 'overturned' ? 'Overturn' : 'Uphold'}
              </Button>
              <Button variant="secondary" size="lg" block onClick={() => setDeciding(null)}>
                Cancel
              </Button>
            </Stack>
          </Sheet>
        ) : null}
      </Stack>
    </StaffPage>
  );
}
