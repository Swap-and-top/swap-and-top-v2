'use client';

/**
 * One user's page, for Trust and safety (GET /api/staff/users/{id}, each
 * look logged), titled "User": one card with their initials, their name
 * with Dpt. leader (department leader) or the like beside it when they are on our team,
 * their standing under it, then who they are in two columns (one below
 * 768 pixels, where the tiles go two by two). Under it, four tiles
 * with counts (actions taken, reports about them, reports they sent,
 * listings), each opening that list as a full table
 * (`/staff/users/{id}/{list}`), with the way back here. "Take action" warns
 * or suspends them, or bans them for a leader
 * (POST /api/staff/users/{id}/action), where the API lets this person act
 * on them (never on a banned account: only an overturned appeal lifts a
 * ban); else it says why not.
 */

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { REPORT_ACTION_LABELS, REPORT_REASON_LABELS, type ReportReason } from '@snt/core';
import { Badge, Bone, Button, ButtonLink, Dropdown, Panel, Sheet, Stack } from '@snt/ui';
import { ChevronRightIcon } from '@snt/ui/icons';
import { apiSend, QueryProblem } from '@/lib/query';
import { staffKeys } from '../../sections';
import { StaffPage } from '../../StaffPage';
import { STANDING_LABEL, STANDING_TONE } from '../standing';
import styles from '../page.module.css';
import record from './record.module.css';
import { useUserRecord, type Kind, type PersonRecord } from './shared';

const ALL_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

/** "TM" from "Tarisai M.", as the account circle shows it. */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'
  );
}

export default function PersonPage({ id }: { id: string }) {
  const { allowed, query } = useUserRecord(id);
  const [acting, setActing] = useState(false);
  const person = query.data;
  const standing = person
    ? `${STANDING_LABEL[person.standing] ?? person.standing}${person.suspendedUntilLabel ? ` until ${person.suspendedUntilLabel}` : ''}`
    : '';
  const base = `/staff/users/${encodeURIComponent(id)}`;

  return (
    <StaffPage
      title="User"
      meta="Their details and record"
      actions={
        !person && allowed !== false && !query.isError ? (
          // Loading: the two buttons' shapes, so nothing jumps when they come.
          <div className={record.toolbar} aria-hidden>
            <Bone width={98} height={32} shape="pill" />
            <Bone width={118} height={32} shape="pill" />
          </div>
        ) : person ? (
          <div className={record.toolbar}>
            {person.cannotAct ? null : (
              <Button size="sm" onClick={() => setActing(true)}>
                Take action
              </Button>
            )}
            <ButtonLink href="/staff/users" variant="secondary" size="sm">
              Back to Users
            </ButtonLink>
            {person.cannotAct ? <p className={record.why}>{person.cannotAct}</p> : null}
          </div>
        ) : null
      }
    >
      <Stack gap={6}>
        {allowed === false ? (
          <Panel padded>
            <p className={styles.lead}>Only Trust and safety can look up users.</p>
          </Panel>
        ) : query.isError ? (
          <QueryProblem error={query.error} onRetry={() => void query.refetch()} />
        ) : !person ? (
          // Loading: the page's own shape. The card with the initials, the
          // name and its pill beside it, the standing under it, the seven
          // facts in the same columns; then the four tiles.
          <>
            <Panel padded>
              <Stack gap={6}>
                <div className={record.who} aria-hidden>
                  <Bone width={52} height={52} shape="circle" />
                  <div className={record.whoText}>
                    <div className={record.nameRow}>
                      <Bone width={120} height={22} />
                      <Bone width={72} height={20} shape="pill" />
                    </div>
                    <Bone width={86} height={18} shape="pill" />
                  </div>
                </div>
                <div className={record.facts} aria-hidden>
                  {Array.from({ length: 7 }, (_, n) => (
                    <div key={n} className={record.fact}>
                      <Bone width={56} height={12} />
                      <Bone width={n % 3 === 0 ? 110 : 76} height={12} />
                    </div>
                  ))}
                </div>
              </Stack>
            </Panel>
            <div className={record.tiles} aria-hidden>
              {Array.from({ length: 4 }, (_, n) => (
                <div key={n} className={[record.tile, record.tileBone].join(' ')}>
                  <Bone width="70%" height={12} />
                  <Bone width={28} height={24} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Who they are: their name and pills, then the details. */}
            <Panel padded>
              <Stack gap={6}>
                <div className={record.who}>
                  <span className={record.avatar} aria-hidden>
                    {initialsOf(person.name)}
                  </span>
                  <div className={record.whoText}>
                    {/* Their place on our team beside the name; their
                        standing under it. */}
                    <div className={record.nameRow}>
                      <h2 className={record.name}>{person.name}</h2>
                      {person.teamLabel ? <Badge tone="accent">{person.teamLabel}</Badge> : null}
                    </div>
                    <span className={record.meta}>
                      <Badge tone={STANDING_TONE[person.standing] ?? 'neutral'} className={record.standing}>
                        {standing}
                      </Badge>
                    </span>
                  </div>
                </div>
                <dl className={record.facts}>
                  <Fact label="Phone">
                    {person.phone ? (
                      <a href={`tel:+263${person.phone.replace(/\D/g, '').slice(1)}`}>{person.phone}</a>
                    ) : (
                      'None given'
                    )}
                  </Fact>
                  <Fact label="Area">{person.location || 'Not given'}</Fact>
                  <Fact label="Joined">{person.joinedLabel}</Fact>
                  <Fact label="Last seen">{person.lastSeenLabel ?? 'Not yet'}</Fact>
                  <Fact label="Deals">{person.confirmedDeals} confirmed</Fact>
                  <Fact label="Listings">
                    {person.liveListings} live
                    {person.liveListings && (person.standing === 'suspended' || person.standing === 'banned')
                      ? ', hidden from buyers for now'
                      : ''}
                  </Fact>
                  <Fact label="Stores">
                    {person.stores.length
                      ? person.stores.map((store, index) => (
                          <span key={store.slug}>
                            {index ? ', ' : ''}
                            <Link href={`/store/${store.slug}`} className={record.link}>
                              {store.name}
                            </Link>{' '}
                            ({store.role === 'owner' ? 'owner' : 'staff'})
                          </span>
                        ))
                      : 'None'}
                  </Fact>
                </dl>
              </Stack>
            </Panel>

            {/* Their record, as counts; each opens the full list. */}
            <div className={record.tiles}>
              <Tile href={`${base}/actions`} label="Actions taken" count={person.actions.length} />
              <Tile href={`${base}/reports`} label="Reports about them" count={person.reports.length} />
              <Tile href={`${base}/sent`} label="Reports they sent" count={person.reportsSent.length} />
              <Tile href={`${base}/listings`} label="Listings" count={person.listings.length} />
            </div>
          </>
        )}
        {acting && person ? (
          <ActionSheet person={person} onClose={() => setActing(false)} onDone={() => setActing(false)} />
        ) : null}
      </Stack>
    </StaffPage>
  );
}

/** One fact: its label over it on a phone, beside it on a laptop. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={record.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** A count on its own white tile, opening its list. */
function Tile({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href} className={record.tile}>
      <span className={record.tileLabel}>{label}</span>
      <span className={record.tileCount}>{count}</span>
      <ChevronRightIcon size={16} className={record.tileChevron} />
    </Link>
  );
}

/** Take action: what to do, starting on a warning, and the reason. */
function ActionSheet({
  person,
  onClose,
  onDone,
}: {
  person: PersonRecord;
  onClose: () => void;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<Kind>('warning');
  const [reason, setReason] = useState<ReportReason>(ALL_REASONS[0]!);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();
  const kindLabel = useId();
  const reasonLabel = useId();
  const kinds = (['warning', 'suspension', 'ban'] as const).filter((value) => value !== 'ban' || person.canBan);

  const save = useMutation({
    mutationFn: () =>
      apiSend(`/staff/users/${encodeURIComponent(person.id)}/action`, 'POST', {
        kind,
        reason,
        note: note.trim(),
      }),
    onSuccess: () => {
      toast.success(`${person.name} has been told.`);
      // Their record, and the log, read again with the action on them.
      void queryClient.invalidateQueries({ queryKey: staffKeys.user(person.id) });
      void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
      onDone();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Sheet narrow title={`Take action on ${person.name}`} onClose={onClose}>
      <Stack gap={5}>
        <div className={styles.field}>
          <span id={kindLabel} className={styles.label}>
            What to do
          </span>
          <Dropdown
            value={kind}
            options={kinds.map((value) => ({ value, label: REPORT_ACTION_LABELS[value] }))}
            onChange={setKind}
            labelledBy={kindLabel}
          />
        </div>
        <div className={styles.field}>
          <span id={reasonLabel} className={styles.label}>
            Reason
          </span>
          <Dropdown
            value={reason}
            options={ALL_REASONS.map((value) => ({ value, label: REPORT_REASON_LABELS[value] }))}
            onChange={setReason}
            labelledBy={reasonLabel}
          />
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Why you decided this</span>
          <textarea
            className={styles.textarea}
            rows={3}
            maxLength={500}
            placeholder="e.g. Several buyers said the same on the phone."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <p className={styles.lead}>{person.name} is told what was decided and why.</p>
        {/* A note saying why is required: off until there is one. */}
        <Button
          size="lg"
          block
          loading={save.isPending}
          disabled={note.trim().length < 2}
          onClick={() => save.mutate()}
        >
          {REPORT_ACTION_LABELS[kind]}
        </Button>
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}
