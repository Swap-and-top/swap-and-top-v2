'use client';

/**
 * The store's owner and staff, on the console's Store profile. Two roles
 * (docs/product/accounts-and-stores.md): the owner can do everything; staff
 * do stock, offers and leads, not payments, verification, staff or
 * settings. Staff sign in with their own accounts: the owner adds them by
 * phone number and removes them in one tap, with Undo. Staff see the list.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button, Field, Panel, Stack } from '@snt/ui';
import { useConsoleRole } from '@/lib/consoleRole';
import { apiAsViewer } from '@/lib/supabase';
import styles from './page.module.css';

interface Member {
  personId: string;
  name: string;
  phone?: string;
  role: 'owner' | 'staff';
  since: string;
}

export function StaffPanel({ storeId }: { storeId: string }) {
  const owner = useConsoleRole() === 'owner';
  const [members, setMembers] = useState<Member[] | null>(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const path = `/stores/${encodeURIComponent(storeId)}/members`;

  useEffect(() => {
    let gone = false;
    void apiAsViewer<{ members: Member[] }>(path, { method: 'GET' }).then(({ data }) => {
      if (!gone && data) setMembers(data.members);
    });
    return () => {
      gone = true;
    };
  }, [path]);

  /** Adds them as staff by their number; true when it worked. */
  async function addBy(number: string): Promise<boolean> {
    const { data, error } = await apiAsViewer<{ members: Member[] }>(path, {
      method: 'POST',
      body: { phone: number },
    });
    if (error || !data) {
      toast.error(error ?? 'We could not add them. Try again in a minute.');
      return false;
    }
    setMembers(data.members);
    return true;
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!phone.trim()) {
      toast.error('Enter their phone number.');
      return;
    }
    setBusy(true);
    const added = await addBy(phone.trim());
    setBusy(false);
    if (added) {
      setPhone('');
      toast.success('Added as staff. They are told in their notifications.');
    }
  }

  async function remove(member: Member) {
    const { data, error } = await apiAsViewer<{ members: Member[] }>(
      `${path}/${encodeURIComponent(member.personId)}`,
      { method: 'DELETE' },
    );
    if (error || !data) {
      toast.error(error ?? 'We could not remove them. Try again in a minute.');
      return;
    }
    setMembers(data.members);
    toast.success(`${member.name} is no longer staff.`, {
      action: member.phone
        ? { label: 'Undo', onClick: () => void addBy(member.phone!) }
        : undefined,
      duration: 4500,
    });
  }

  return (
    <Panel padded className={styles.staff}>
      <Stack gap={5}>
        <div>
          <h2 className={styles.staffTitle}>Staff</h2>
          <p className={styles.staffLead}>
            {owner
              ? 'Staff sign in with their own accounts and look after stock, offers and leads. Payments and settings stay with you.'
              : 'You look after stock, offers and leads. Payments and settings are the owner’s.'}
          </p>
        </div>

        {members ? (
          <ul className={styles.members}>
            {members.map((member) => (
              <li key={member.personId} className={styles.member}>
                <span className={styles.memberText}>
                  <span className={styles.memberName}>{member.name}</span>
                  <span className={styles.memberLine}>
                    {member.role === 'owner' ? 'Owner' : 'Staff'}
                    {member.phone ? ` · ${member.phone}` : ''} · since {member.since}
                  </span>
                </span>
                {owner && member.role === 'staff' ? (
                  <Button variant="secondary" size="sm" onClick={() => void remove(member)}>
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {owner ? (
          <form onSubmit={add}>
            <Stack gap={4}>
              <Field
                label="Add staff by phone number"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="e.g. 077 123 4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button type="submit" block loading={busy}>
                Add staff
              </Button>
            </Stack>
          </form>
        ) : null}
      </Stack>
    </Panel>
  );
}
