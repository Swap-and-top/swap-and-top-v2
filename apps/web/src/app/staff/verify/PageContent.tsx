'use client';

/**
 * Verify stores, a section of the Staff console, for Trust and safety
 * leaders (and the super admin), set as Reports and Appeals are
 * (GET /api/admin/verifications): every request for the Verified store
 * badge, the waiting ones first, oldest first, then the decided ones,
 * newest first. The filter narrows it to waiting, verified or declined,
 * each with its count. On a laptop a table; below, one compact line each,
 * as an email in a mail app. Waiting ones read as unread, bold with a blue
 * dot and a small Decide button. A row opens the full request: the store,
 * its owner and their number to call, what they gave, and Decline or
 * Verify, each with a note saying why (POST /api/admin/verifications/{id}).
 * A decline's note is told to the owner; a verify's is kept on record.
 * Once decided, the sheet says by whom and why.
 */

import Link from 'next/link';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Bone, Button, ButtonLink, Dropdown, Panel, Sheet, Stack, type BadgeTone } from '@snt/ui';
import { refreshStore } from '@/lib/refresh';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import styles from './page.module.css';

type Show = 'all' | 'waiting' | 'verified' | 'declined';
type Outcome = 'verified' | 'declined';
type Decision = 'approve' | 'decline';

interface Request {
  id: string;
  storeName: string;
  storeSlug: string;
  location: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  kind: 'registered' | 'informal';
  reference: string;
  askedLabel: string;
  state: 'waiting' | Outcome;
  decided?: { by: string; dateLabel: string; note?: string };
}

interface RequestList {
  requests: Request[];
  counts: Record<Show, number>;
}

/** The filter's choices, in its order. */
const SHOW_LABELS: Record<Show, string> = {
  all: 'All requests',
  waiting: 'Waiting',
  verified: 'Verified',
  declined: 'Declined',
};

/** The kind of business, as a pill. */
const KIND: Record<Request['kind'], { label: string; tone: BadgeTone }> = {
  registered: { label: 'Registered business', tone: 'accent' },
  informal: { label: 'Informal trader', tone: 'neutral' },
};

/** How the request was decided, as a pill. */
const OUTCOME: Record<Outcome, { label: string; tone: BadgeTone }> = {
  verified: { label: 'Verified', tone: 'success' },
  declined: { label: 'Declined', tone: 'neutral' },
};

/** "GE" from "Gadget Express". */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}\p{N}]/gu, '').charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'S'
  );
}

/** "077 123 4567" as a number to call: +263 77 123 4567. */
const telOf = (phone: string) => `tel:+263${phone.replace(/\D/g, '').slice(1)}`;

export default function VerifyStoresPage() {
  /** Trust and safety leaders verify stores (and the super admin). */
  const leader = useInDepartment('trust_safety', true);
  const showLabel = useId();
  const [show, setShow] = useState<Show>('all');
  /** The request open in its sheet, by id, so it follows the list. */
  const [openId, setOpenId] = useState<string | null>(null);
  /** Which way it is being decided, while the note is asked for. */
  const [deciding, setDeciding] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: [...staffKeys.verify, show],
    queryFn: () => apiGet<RequestList>(`/admin/verifications?show=${show}`),
    enabled: leader === true,
    // The rows on show stay while another filter loads.
    placeholderData: keepPreviousData,
  });
  const requests = list.data?.requests ?? null;
  const counts = list.data?.counts;
  const opened = requests?.find((request) => request.id === openId) ?? null;

  const close = () => {
    setOpenId(null);
    setDeciding(null);
    setNote('');
  };

  const decide = useMutation({
    mutationFn: async ({ request, decision }: { request: Request; decision: Decision }) => {
      await apiSend(`/admin/verifications/${encodeURIComponent(request.id)}`, 'POST', { decision, note: note.trim() });
      // The store's page shows the badge at once, not when its minute is up.
      if (decision === 'approve') await refreshStore(request.storeSlug);
    },
    onSuccess: (_, { request, decision }) => {
      // Every filter of the list, the log and the owner's record.
      void queryClient.invalidateQueries({ queryKey: staffKeys.verify });
      void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
      void queryClient.invalidateQueries({ queryKey: staffKeys.user(request.ownerId) });
      close();
      toast.success(
        decision === 'approve'
          ? `${request.storeName} is now a Verified store.`
          : `${request.storeName} was declined. The owner has been told why.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <StaffPage
      title="Verify stores"
      meta="Stores asking for the Verified store badge, the waiting ones first"
      actions={
        leader ? (
          <div className={styles.toolbar}>
            <span id={showLabel} hidden>
              Show
            </span>
            <Dropdown<Show>
              value={show}
              options={(Object.keys(SHOW_LABELS) as Show[]).map((value) => ({
                value,
                label: SHOW_LABELS[value],
                count: counts?.[value],
              }))}
              onChange={setShow}
              labelledBy={showLabel}
              className={styles.filter}
            />
          </div>
        ) : null
      }
    >
      {leader === false ? (
        <Panel padded>
          <p className={styles.lead}>Only Trust and safety leaders can verify stores.</p>
        </Panel>
      ) : list.isError && !list.data ? (
        <QueryProblem error={list.error} onRetry={() => void list.refetch()} />
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>
            {!counts
              ? ' '
              : show === 'all'
                ? `${counts.all} ${counts.all === 1 ? 'request' : 'requests'}, ${counts.waiting} waiting`
                : `${counts[show]} ${SHOW_LABELS[show].toLowerCase()}`}
          </p>
          {/* Faded while another filter loads, over the rows still on show. */}
          <div
            className={[styles.list, list.isPlaceholderData ? styles.loading : ''].filter(Boolean).join(' ')}
            aria-busy={list.isPlaceholderData || undefined}
          >
            <div className={styles.headerRow} aria-hidden>
              <span />
              <span>Store</span>
              <span>Owner</span>
              <span>Business</span>
              <span>Number</span>
              <span>Asked</span>
              <span />
            </div>
            {requests === null ? (
              // Loading: rows of the table's own shape.
              Array.from({ length: 3 }, (_, n) => (
                <div key={n} className={[styles.row, styles.boneRow].join(' ')} aria-hidden>
                  <Bone width={32} height={32} shape="circle" />
                  <span className={styles.head}>
                    <Bone width="70%" height={12} />
                  </span>
                  <span className={styles.owner}>
                    <Bone width="60%" height={12} />
                  </span>
                  <span className={styles.kind}>
                    <Bone width={120} height={20} shape="pill" />
                  </span>
                  <span className={styles.reference}>
                    <Bone width="60%" height={12} />
                  </span>
                  <span className={styles.when}>
                    <Bone width={44} height={12} />
                  </span>
                  <span className={styles.status}>
                    <Bone width={64} height={26} shape="pill" />
                  </span>
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className={styles.none}>
                <p>
                  {show === 'all'
                    ? 'No stores have asked to be verified yet.'
                    : show === 'waiting'
                      ? 'No stores are waiting to be verified.'
                      : `No requests are ${SHOW_LABELS[show].toLowerCase()}.`}
                </p>
                {show !== 'all' ? (
                  <Button variant="secondary" size="sm" onClick={() => setShow('all')}>
                    Show all requests
                  </Button>
                ) : null}
              </div>
            ) : (
              requests.map((request) => {
                const waiting = request.state === 'waiting';
                const kind = KIND[request.kind];
                return (
                  <div
                    key={request.id}
                    className={[styles.row, waiting ? styles.unread : ''].filter(Boolean).join(' ')}
                    role="button"
                    tabIndex={0}
                    aria-label={`${request.storeName}, run by ${request.ownerName}: open the request`}
                    onClick={() => setOpenId(request.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') setOpenId(request.id);
                    }}
                  >
                    {waiting ? <span className={styles.dot} aria-hidden /> : null}
                    <span className={styles.initials} aria-hidden>
                      {initialsOf(request.storeName)}
                    </span>
                    <span className={styles.head}>
                      <span className={styles.strong}>{request.storeName}</span>
                    </span>
                    <span className={styles.sub}>
                      {request.ownerName}, {kind.label.toLowerCase()}
                    </span>
                    <span className={styles.owner}>{request.ownerName}</span>
                    <span className={styles.kind}>
                      <Badge tone={kind.tone}>{kind.label}</Badge>
                    </span>
                    <span className={styles.reference}>{request.reference}</span>
                    <span className={styles.when}>{request.askedLabel}</span>
                    <span className={styles.status}>
                      {waiting ? (
                        <button
                          type="button"
                          className={styles.claim}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenId(request.id);
                          }}
                        >
                          Decide
                        </button>
                      ) : (
                        <Badge tone={OUTCOME[request.state as Outcome].tone}>
                          {OUTCOME[request.state as Outcome].label}
                        </Badge>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {opened && !deciding ? (
        <RequestDetail request={opened} onClose={close} onDecide={setDeciding} />
      ) : null}
      {opened && deciding ? (
        <Sheet
          narrow
          title={deciding === 'approve' ? `Verify ${opened.storeName}` : `Decline ${opened.storeName}`}
          onClose={() => setDeciding(null)}
        >
          <Stack gap={4}>
            <p className={styles.lead}>
              {deciding === 'approve'
                ? 'The store shows the Verified store badge at once. Say what you checked, for the record.'
                : 'Tell the owner why, so they know what to fix.'}
            </p>
            <textarea
              className={styles.textarea}
              rows={3}
              maxLength={300}
              placeholder={
                deciding === 'approve'
                  ? 'e.g. Saw the certificate and their ID on a video call.'
                  : 'e.g. The licence number does not match the council records.'
              }
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            {/* A note saying why is required: off until there is one. */}
            <Button
              size="lg"
              block
              disabled={note.trim().length < 2}
              loading={decide.isPending}
              onClick={() => decide.mutate({ request: opened, decision: deciding })}
            >
              {deciding === 'approve' ? 'Verify' : 'Decline'}
            </Button>
            <Button variant="secondary" size="lg" block onClick={() => setDeciding(null)}>
              Cancel
            </Button>
          </Stack>
        </Sheet>
      ) : null}
    </StaffPage>
  );
}

/** The full request: the store, its owner and what they gave, and Decline
    or Verify while it waits; once decided, by whom and why. */
function RequestDetail({
  request,
  onClose,
  onDecide,
}: {
  request: Request;
  onClose: () => void;
  onDecide: (decision: Decision) => void;
}) {
  const waiting = request.state === 'waiting';
  return (
    <Sheet narrow title={request.storeName} onClose={onClose}>
      <Stack gap={5}>
        {waiting ? (
          <p className={styles.lead}>
            Call the owner to see their documents (the registration certificate or licence, and
            their ID) and a photo or short video call of the shop. Then verify the store, or
            decline it and say why.
          </p>
        ) : null}
        <dl className={styles.facts}>
          <dt>Store</dt>
          <dd>
            <Link href={`/store/${request.storeSlug}`} className={styles.personLink}>
              {request.storeName}
            </Link>
          </dd>
          <dt>Owner</dt>
          <dd>
            <Link href={`/staff/users/${encodeURIComponent(request.ownerId)}`} className={styles.personLink}>
              {request.ownerName}
            </Link>
          </dd>
          <dt>Phone</dt>
          <dd>
            {request.ownerPhone ? (
              <a href={telOf(request.ownerPhone)} className={styles.personLink}>
                {request.ownerPhone}
              </a>
            ) : (
              'None given'
            )}
          </dd>
          <dt>Business</dt>
          <dd>{KIND[request.kind].label}</dd>
          <dt>{request.kind === 'registered' ? 'Registration number' : 'Licence number'}</dt>
          <dd>{request.reference}</dd>
          <dt>Area</dt>
          <dd>{request.location}</dd>
          <dt>Asked</dt>
          <dd>{request.askedLabel}</dd>
          {request.decided ? (
            <>
              <dt>Outcome</dt>
              <dd>
                {OUTCOME[request.state as Outcome].label}, by {request.decided.by} on {request.decided.dateLabel}
              </dd>
              {request.decided.note ? (
                <>
                  <dt>Why</dt>
                  <dd>{request.decided.note}</dd>
                </>
              ) : null}
            </>
          ) : null}
        </dl>
        <ButtonLink href={`/store/${request.storeSlug}`} variant="secondary" block>
          View the store
        </ButtonLink>
        {waiting ? (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => onDecide('decline')}>
              Decline
            </Button>
            <Button onClick={() => onDecide('approve')}>Verify</Button>
          </div>
        ) : null}
      </Stack>
    </Sheet>
  );
}
