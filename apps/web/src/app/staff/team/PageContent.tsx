'use client';

/**
 * Team, in the Staff console (docs/product/staff-console.md, section 4),
 * set as Users, Reports and Appeals are: the search box, a filter pill by
 * department (with counts) and Add a user in the toolbar; a count line;
 * then one table, a row per member of the team (their initials and name,
 * which opens their user record, their phone) and a column per department
 * showing "Dpt. leader", "Member" or nothing. On a phone, one compact line
 * each, their departments as small pills.
 *
 * A row opens a sheet with one line per department and three choices,
 * Not in, Member and Leader, each saving at once (PUT or DELETE
 * /api/staff/team/{personId}/{department}, logged), and, for the super
 * admin, Remove from the team. Add a user finds someone and opens the same
 * sheet. The super admin sees every department and makes leaders; a leader
 * sees only the departments they are leader of, adds and takes out members
 * there, and sees who leads without changing it. Nobody changes their own
 * access here.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { DEPARTMENT_LABELS, type Department } from '@snt/core';
import { Badge, Bone, Button, ButtonLink, Dropdown, EmptyState, Field, Panel, Sheet, Stack } from '@snt/ui';
import { PlusIcon } from '@snt/ui/icons';
import { ApiError, apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useDebounced } from '@/lib/useDebounced';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { initialsOf } from '../users/standing';
import styles from './page.module.css';

interface Member {
  personId: string;
  name: string;
  phone?: string;
  departments: { department: Department; lead: boolean }[];
  self: boolean;
}

interface TeamData {
  manages: Department[];
  superAdmin: boolean;
  members: Member[];
}

/** Where someone is in a department. */
type Place = 'out' | 'member' | 'leader';

const placeIn = (member: Member, department: Department): Place => {
  const row = member.departments.find((r) => r.department === department);
  return !row ? 'out' : row.lead ? 'leader' : 'member';
};

/** Their place as a pill: "Dpt. leader" or "Member"; nothing when out. */
function PlacePill({ place }: { place: Place }) {
  if (place === 'out') return null;
  return <Badge tone={place === 'leader' ? 'accent' : 'neutral'}>{place === 'leader' ? 'Dpt. leader' : 'Member'}</Badge>;
}

export default function TeamPage() {
  const showLabel = useId();
  const [query, setQuery] = useState('');
  const [show, setShow] = useState<'all' | Department>('all');
  const [adding, setAdding] = useState(false);
  /** The member whose departments are open in the sheet, by id. */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Someone picked in Add a user who is not on the team yet. */
  const [picked, setPicked] = useState<Member | null>(null);
  /** Who is about to be removed from the team, while it is confirmed. */
  const [removing, setRemoving] = useState<Member | null>(null);

  const queryClient = useQueryClient();
  const loaded = useQuery({ queryKey: staffKeys.team, queryFn: () => apiGet<TeamData>('/staff/team') });
  const team = loaded.data;
  /** Not open to them: a plain no, said as such, not as a fault. */
  const closed = loaded.error instanceof ApiError && loaded.error.status === 403 ? loaded.error.message : null;

  /** Puts the saved member back in the list, or out of it with no
      departments left that this page shows. */
  function keep(member: Member) {
    queryClient.setQueryData<TeamData>(staffKeys.team, (now) => {
      if (!now) return now;
      const others = now.members.filter((m) => m.personId !== member.personId);
      const members = member.departments.length
        ? [...others, member].sort((a, b) => a.name.localeCompare(b.name))
        : others;
      return { ...now, members };
    });
    // The one open in the sheet stays there, even once out of every
    // department (so they can be put back), and shows the change.
    setPicked((now) =>
      (now && now.personId === member.personId) || member.personId === editingId ? member : now,
    );
  }

  /** A change to the team is in the log too. */
  const logged = () => void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });

  const change = useMutation({
    mutationFn: ({ member, department, place }: { member: Member; department: Department; place: Place }) => {
      const path = `/staff/team/${encodeURIComponent(member.personId)}/${department}`;
      return place === 'out'
        ? apiSend<Member>(path, 'DELETE')
        : apiSend<Member>(path, 'PUT', { lead: place === 'leader' });
    },
    onSuccess: (saved, { member, department, place }) => {
      keep(saved);
      logged();
      const label = DEPARTMENT_LABELS[department];
      const was = placeIn(member, department);
      toast.success(
        place === 'out'
          ? `${member.name} is out of ${label}.`
          : place === 'leader'
            ? `${member.name} is now the leader of ${label}.`
            : was === 'leader'
              ? `${member.name} is no longer the leader of ${label}.`
              : `${member.name} is now in ${label}.`,
      );
    },
    onError: (error) => toast.error(error.message || 'That did not save. Try again.'),
  });

  const removeFromTeam = useMutation({
    mutationFn: (member: Member) => apiSend(`/staff/team/${encodeURIComponent(member.personId)}`, 'DELETE'),
    onSuccess: (_, member) => {
      setRemoving(null);
      setEditingId(null);
      keep({ ...member, departments: [] });
      logged();
      toast.success(`${member.name} is off the team.`);
    },
    onError: (error) => {
      setRemoving(null);
      toast.error(error.message);
    },
  });

  /** The department being saved, so its choices wait. */
  const saving = change.isPending ? `${change.variables?.member.personId}:${change.variables?.department}` : null;

  // Search and the department filter, here: the team is small.
  const words = useDebounced(query.trim().toLowerCase(), 200);
  const digits = words.replace(/\D/g, '');
  const matches = (member: Member) =>
    !words ||
    member.name.toLowerCase().includes(words) ||
    (digits.length >= 3 && (member.phone ?? '').replace(/\D/g, '').includes(digits));
  const all = team?.members ?? [];
  const searched = all.filter(matches);
  const shown = show === 'all' ? searched : searched.filter((member) => placeIn(member, show) !== 'out');
  const countIn = (department: Department) => searched.filter((member) => placeIn(member, department) !== 'out').length;
  const editing = all.find((member) => member.personId === editingId) ?? (picked?.personId === editingId ? picked : null);

  const departments = team?.manages ?? [];

  return (
    <StaffPage
      title="Team members"
      meta={team ? (team.superAdmin ? 'Who is in each department' : 'The departments you are leader of') : undefined}
      actions={
        closed ? null : (
          <div className={styles.toolbar}>
            <Field
              label="Find someone on the team"
              hideLabel
              type="search"
              placeholder="e.g. Rumbi or 077 000 0005"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              size="sm"
              filled
              className={styles.search}
            />
            <span id={showLabel} hidden>
              Show
            </span>
            <Dropdown<'all' | Department>
              value={show}
              options={[
                { value: 'all' as const, label: 'Whole team', count: team ? searched.length : undefined },
                ...departments.map((department) => ({
                  value: department,
                  label: DEPARTMENT_LABELS[department],
                  count: team ? countIn(department) : undefined,
                })),
              ]}
              onChange={setShow}
              labelledBy={showLabel}
              className={styles.filter}
            />
            <Button size="sm" onClick={() => setAdding(true)} disabled={!team}>
              <PlusIcon size={15} />
              Add a user
            </Button>
          </div>
        )
      }
    >
      {closed ? (
        <EmptyState title="Team is not open to you" body={closed} />
      ) : loaded.isError && !team ? (
        <QueryProblem error={loaded.error} onRetry={() => void loaded.refetch()} />
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>
            {!team ? ' ' : `${shown.length} on the team${words || show !== 'all' ? ' found' : ''}`}
          </p>
          <div
            className={styles.list}
            // One column per department the page shows.
            style={{ ['--departments' as string]: Math.max(1, departments.length) }}
          >
            <div className={styles.headerRow} aria-hidden>
              <span />
              <span>Name</span>
              <span>Phone</span>
              {departments.map((department) => (
                <span key={department} className={styles.deptHead}>
                  {DEPARTMENT_LABELS[department]}
                </span>
              ))}
            </div>
            {!team ? (
              Array.from({ length: 4 }, (_, n) => (
                <div key={n} className={[styles.row, styles.boneRow].join(' ')}>
                  <Bone width={32} height={32} shape="circle" />
                  <Bone width="70%" height={12} />
                  <Bone width="60%" height={12} />
                </div>
              ))
            ) : shown.length === 0 ? (
              <div className={styles.none}>
                <p>{all.length === 0 ? 'Nobody here yet. Add a user to put them in a department.' : 'Nobody matches.'}</p>
                {words || show !== 'all' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setShow('all');
                    }}
                  >
                    Show the whole team
                  </Button>
                ) : null}
              </div>
            ) : (
              shown.map((member) => (
                <div
                  key={member.personId}
                  className={styles.row}
                  role="button"
                  tabIndex={0}
                  aria-label={`${member.name}: change their departments`}
                  onClick={() => setEditingId(member.personId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setEditingId(member.personId);
                  }}
                >
                  <span className={styles.initials} aria-hidden>
                    {initialsOf(member.name)}
                  </span>
                  <span className={styles.name}>
                    <span className={styles.strong}>{member.name}</span>
                    {member.self ? <span className={styles.you}>You</span> : null}
                    {/* On a phone: their departments as small pills, under the name. */}
                    <span className={styles.phoneOnly}>
                      {member.departments
                        .filter((row) => departments.includes(row.department))
                        .map((row) => (
                          <Badge key={row.department} tone={row.lead ? 'accent' : 'neutral'}>
                            {`${DEPARTMENT_LABELS[row.department]}${row.lead ? ', Dpt. leader' : ''}`}
                          </Badge>
                        ))}
                    </span>
                  </span>
                  <span className={styles.phone}>{member.phone ?? 'None'}</span>
                  {departments.map((department) => (
                    <span key={department} className={styles.dept}>
                      <PlacePill place={placeIn(member, department)} />
                    </span>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {editing && team ? (
        <DepartmentsSheet
          member={editing}
          team={team}
          saving={saving}
          onChange={(department, place) => change.mutate({ member: editing, department, place })}
          onRemove={team.superAdmin && editing.departments.length && !editing.self ? () => setRemoving(editing) : undefined}
          onClose={() => {
            setEditingId(null);
            setPicked(null);
          }}
        />
      ) : null}

      {adding && team ? (
        <AddUser
          onPick={(member) => {
            setAdding(false);
            // Already on the team: their own row; else held here until saved.
            if (!all.some((m) => m.personId === member.personId)) setPicked(member);
            setEditingId(member.personId);
          }}
          onClose={() => setAdding(false)}
        />
      ) : null}

      {removing ? (
        <Sheet narrow title={`Remove ${removing.name}`} onClose={() => setRemoving(null)}>
          <Stack gap={4}>
            <p className={styles.lead}>
              {removing.name} will be taken out of every department at once and lose the Staff console. Their own
              account stays as it is.
            </p>
            <Button variant="secondary" size="lg" block onClick={() => setRemoving(null)}>
              Keep them
            </Button>
            <Button size="lg" block loading={removeFromTeam.isPending} onClick={() => removeFromTeam.mutate(removing)}>
              Remove from the team
            </Button>
          </Stack>
        </Sheet>
      ) : null}
    </StaffPage>
  );
}

/**
 * One member's departments: a line each with Not in, Member and Leader,
 * saving at once. The super admin makes leaders; a leader adds and takes
 * out members of their own departments only, and a department's leader is
 * shown, not changed. Nobody changes their own.
 */
function DepartmentsSheet({
  member,
  team,
  saving,
  onChange,
  onRemove,
  onClose,
}: {
  member: Member;
  team: TeamData;
  saving: string | null;
  onChange: (department: Department, place: Place) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet narrow title={member.name} onClose={onClose}>
      <Stack gap={5}>
        {member.phone ? <p className={styles.lead}>{member.phone}</p> : null}
        {member.self ? (
          <p className={styles.note}>Your own access is changed by the super admin.</p>
        ) : !team.superAdmin ? (
          <p className={styles.note}>Only the super admin makes or changes a leader.</p>
        ) : null}
        <div className={styles.choices}>
          {team.manages.map((department) => {
            const place = placeIn(member, department);
            const busy = saving === `${member.personId}:${department}`;
            // Their own row, or a leader's row for anyone but the super admin.
            const locked = member.self || (!team.superAdmin && place === 'leader');
            const options: { value: Place; label: string }[] = [
              { value: 'out', label: 'Not in' },
              { value: 'member', label: 'Member' },
              { value: 'leader', label: 'Leader' },
            ];
            return (
              <div key={department} className={styles.choice}>
                <span className={styles.choiceLabel}>{DEPARTMENT_LABELS[department]}</span>
                <div className={styles.segments} role="group" aria-label={DEPARTMENT_LABELS[department]} aria-busy={busy || undefined}>
                  {options.map((option) => {
                    const on = option.value === place;
                    const off = locked || busy || (!team.superAdmin && option.value === 'leader');
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={on}
                        disabled={off && !on}
                        className={[styles.segment, on ? styles.segmentOn : '', off ? styles.segmentLocked : '']
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          if (!on && !off) onChange(department, option.value);
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <ButtonLink href={`/staff/users/${encodeURIComponent(member.personId)}`} variant="secondary" block>
          View their user record
        </ButtonLink>
        {onRemove ? (
          <Button variant="secondary" block onClick={onRemove}>
            Remove from the team
          </Button>
        ) : null}
        <Button variant="secondary" block onClick={onClose}>
          Done
        </Button>
      </Stack>
    </Sheet>
  );
}

/** Add a user: find someone by name or number, then their departments. */
function AddUser({ onPick, onClose }: { onPick: (member: Member) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  // Searched as they type, from two letters or digits, once they pause.
  const q = useDebounced(query.trim(), 250);
  const search = useQuery({
    queryKey: staffKeys.teamFind(q),
    queryFn: () => apiGet<{ people: Member[] }>(`/staff/team/find?q=${encodeURIComponent(q)}`).then((data) => data.people),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
  });
  const found = query.trim().length >= 2 ? search.data : undefined;

  return (
    <Sheet narrow title="Add a user" onClose={onClose}>
      <Stack gap={5}>
        <Field
          label="Find them by name or phone number"
          placeholder="e.g. Rumbi or 077 000 0005"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
        {search.isError && query.trim().length >= 2 ? (
          <QueryProblem error={search.error} onRetry={() => void search.refetch()} />
        ) : !found ? null : found.length === 0 ? (
          <p className={styles.lead}>Nobody matches. They need an account first.</p>
        ) : (
          <Panel>
            <div className={styles.found}>
              {found.map((person) => (
                <button key={person.personId} type="button" className={styles.foundRow} onClick={() => onPick(person)}>
                  <span className={styles.initials} aria-hidden>
                    {initialsOf(person.name)}
                  </span>
                  <span className={styles.name}>
                    <span className={styles.strong}>{person.name}</span>
                    {person.phone ? <span className={styles.small}>{person.phone}</span> : null}
                  </span>
                  <span className={styles.small}>{person.departments.length ? 'On the team' : 'Not on the team'}</span>
                </button>
              ))}
            </div>
          </Panel>
        )}
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}
