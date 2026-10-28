'use client';

/**
 * Team, in the Staff console (docs/product/staff-console.md, section 4):
 * each person on the team once, with a tick per department; once a
 * department is ticked, "Leads it" beside it. Each tick saves at once
 * (PUT or DELETE /api/staff/team/{personId}/{department}) and is logged.
 *
 * The super admin sees every department, makes leads and can remove someone
 * from the team. A lead sees only the departments they lead, adds and takes
 * out members there, and sees who leads without changing it. Nobody changes
 * their own access here.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DEPARTMENT_LABELS, type Department } from '@snt/core';
import { Button, EmptyState, Field, Panel, Sheet, Stack, TickTile } from '@snt/ui';
import { PlusIcon } from '@snt/ui/icons';
import { apiAsViewer } from '@/lib/supabase';
import { StaffPage } from '../StaffPage';
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

export default function TeamPage() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  /** The person whose departments are being saved, so their ticks wait. */
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  /** The person picked in Add a person, shown with their ticks. */
  const [picked, setPicked] = useState<Member | null>(null);
  /** Who is about to be removed from the team, while it is confirmed. */
  const [removing, setRemoving] = useState<Member | null>(null);

  useEffect(() => {
    let gone = false;
    void apiAsViewer<TeamData>('/staff/team', { method: 'GET' }).then(({ data, error }) => {
      if (gone) return;
      if (error || !data) setProblem(error ?? 'The team could not be loaded.');
      else setTeam(data);
    });
    return () => {
      gone = true;
    };
  }, []);

  /** Puts the saved person back in the list, or out of it with no
      departments left that this page shows. */
  function keep(member: Member) {
    setTeam((now) => {
      if (!now) return now;
      const others = now.members.filter((m) => m.personId !== member.personId);
      const members = member.departments.length
        ? [...others, member].sort((a, b) => a.name.localeCompare(b.name))
        : others;
      return { ...now, members };
    });
    setPicked((now) => (now && now.personId === member.personId ? member : now));
  }

  async function change(member: Member, department: Department, on: boolean, lead: boolean) {
    setBusy(member.personId);
    const path = `/staff/team/${encodeURIComponent(member.personId)}/${department}`;
    const { data, error } = on
      ? await apiAsViewer<Member>(path, { method: 'PUT', body: { lead } })
      : await apiAsViewer<Member>(path, { method: 'DELETE' });
    setBusy(null);
    if (error || !data) {
      toast.error(error ?? 'That did not save. Try again.');
      return;
    }
    keep(data);
    const label = DEPARTMENT_LABELS[department];
    const was = member.departments.find((row) => row.department === department);
    toast.success(
      !on
        ? `${member.name} is out of ${label}.`
        : !was
          ? `${member.name} is now in ${label}.`
          : lead
            ? `${member.name} now leads ${label}.`
            : `${member.name} no longer leads ${label}.`,
    );
  }

  async function removeFromTeam(member: Member) {
    setBusy(member.personId);
    const { error } = await apiAsViewer(`/staff/team/${encodeURIComponent(member.personId)}`, {
      method: 'DELETE',
    });
    setBusy(null);
    setRemoving(null);
    if (error) {
      toast.error(error);
      return;
    }
    keep({ ...member, departments: [] });
    toast.success(`${member.name} is off the team.`);
  }

  const card = (member: Member) =>
    team ? (
      <MemberCard
        key={member.personId}
        member={member}
        team={team}
        busy={busy === member.personId}
        onChange={(department, on, lead) => void change(member, department, on, lead)}
        onRemove={team.superAdmin && member.departments.length ? () => setRemoving(member) : undefined}
      />
    ) : null;

  return (
    <StaffPage
      title="Team"
      meta={team ? (team.superAdmin ? 'Who is in each department' : 'The departments you lead') : undefined}
      actions={
        team ? (
          <Button size="md" onClick={() => setAdding(true)}>
            <PlusIcon size={17} />
            Add a person
          </Button>
        ) : null
      }
    >
      {problem ? (
        <EmptyState title="Team is not open to you" body={problem} />
      ) : !team ? null : team.members.length === 0 ? (
        <EmptyState title="Nobody here yet" body="Add a person to put them in a department." />
      ) : (
        <div className={styles.members}>{team.members.map(card)}</div>
      )}

      {adding && team ? (
        <AddPerson
          picked={picked}
          card={card}
          onPick={setPicked}
          onClose={() => {
            setAdding(false);
            setPicked(null);
          }}
        />
      ) : null}

      {removing ? (
        <Sheet narrow title={`Remove ${removing.name}`} onClose={() => setRemoving(null)}>
          <Stack gap={4}>
            <p className={styles.lead}>
              {removing.name} will be taken out of every department at once and lose the Staff
              console. Their own account stays as it is.
            </p>
            <Button variant="secondary" size="lg" block onClick={() => setRemoving(null)}>
              Keep them
            </Button>
            <Button size="lg" block loading={busy === removing.personId} onClick={() => void removeFromTeam(removing)}>
              Remove from the team
            </Button>
          </Stack>
        </Sheet>
      ) : null}
    </StaffPage>
  );
}

function MemberCard({
  member,
  team,
  busy,
  onChange,
  onRemove,
}: {
  member: Member;
  team: TeamData;
  busy: boolean;
  onChange: (department: Department, on: boolean, lead: boolean) => void;
  onRemove?: () => void;
}) {
  return (
    <Panel padded>
      <Stack gap={4}>
        <div className={styles.who}>
          <h2 className={styles.name}>{member.name}</h2>
          {member.phone ? <span className={styles.phone}>{member.phone}</span> : null}
        </div>
        {member.self ? (
          <p className={styles.lead}>Your own access is changed by the super admin.</p>
        ) : null}
        {team.manages.map((department) => {
          const row = member.departments.find((r) => r.department === department);
          const on = Boolean(row);
          // Leads are the super admin's to make; a lead's own row is not
          // theirs to change either.
          const leadLocked = !team.superAdmin;
          const rowLocked = member.self || busy || (!team.superAdmin && Boolean(row?.lead));
          return (
            <div key={department} className={[styles.department, on ? styles.on : ''].filter(Boolean).join(' ')}>
              <TickTile
                checked={on}
                disabled={rowLocked}
                label={DEPARTMENT_LABELS[department]}
                onChange={(next) => onChange(department, next, false)}
              />
              {on ? (
                <TickTile
                  checked={Boolean(row?.lead)}
                  disabled={rowLocked || leadLocked}
                  label="Leads it"
                  onChange={(next) => onChange(department, true, next)}
                />
              ) : null}
            </div>
          );
        })}
        {onRemove ? (
          <Button variant="secondary" block onClick={onRemove} disabled={busy}>
            Remove from the team
          </Button>
        ) : null}
      </Stack>
    </Panel>
  );
}

function AddPerson({
  picked,
  card,
  onPick,
  onClose,
}: {
  picked: Member | null;
  card: (member: Member) => React.ReactNode;
  onPick: (member: Member | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Member[] | null>(null);

  // Searched as they type, from two letters or digits.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setFound(null);
      return;
    }
    let gone = false;
    const timer = window.setTimeout(() => {
      void apiAsViewer<{ people: Member[] }>(`/staff/team/find?q=${encodeURIComponent(q)}`, {
        method: 'GET',
      }).then(({ data }) => {
        if (!gone) setFound(data?.people ?? []);
      });
    }, 250);
    return () => {
      gone = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <Sheet title="Add a person" onClose={onClose}>
      <Stack gap={5}>
        {picked ? (
          <>
            {card(picked)}
            <Button variant="secondary" size="lg" block onClick={() => onPick(null)}>
              Find someone else
            </Button>
          </>
        ) : (
          <>
            <Field
              label="Find them by name or phone number"
              placeholder="e.g. Rumbi or 077 000 0005"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            {found === null ? null : found.length === 0 ? (
              <p className={styles.lead}>Nobody matches. They need an account first.</p>
            ) : (
              <div className={styles.results}>
                {found.map((person) => (
                  <button key={person.personId} type="button" className={styles.result} onClick={() => onPick(person)}>
                    <span>
                      <strong>{person.name}</strong>
                      {person.phone ? <span className={styles.phone}> · {person.phone}</span> : null}
                    </span>
                    <span className={styles.phone}>
                      {person.departments.length ? 'On the team' : 'Not on the team'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Done
        </Button>
      </Stack>
    </Sheet>
  );
}
