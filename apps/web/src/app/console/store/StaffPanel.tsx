'use client';

/**
 * The store's owner and staff, on the console's Store profile. Two roles
 * (docs/product/accounts-and-stores.md): the owner can do everything; staff
 * do stock, offers and leads, not payments, verification, staff or
 * settings. Staff sign in with their own accounts: the owner adds them by
 * phone number and removes them in one tap, with Undo. Staff see the list.
 * Loaded and changed through TanStack Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button, Field, Panel, Stack } from '@snt/ui';
import { useConsoleRole } from '@/lib/consoleRole';
import { apiGet, apiSend } from '@/lib/query';
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
  const [phone, setPhone] = useState('');
  const path = `/stores/${encodeURIComponent(storeId)}/members`;
  const key = ['store', storeId, 'members'];
  const queryClient = useQueryClient();
  const { data: members } = useQuery({
    queryKey: key,
    queryFn: () => apiGet<{ members: Member[] }>(path).then((data) => data.members),
  });
  /** The list as the API now has it, after a change. */
  const keep = (data: { members: Member[] }) => queryClient.setQueryData(key, data.members);

  const addMember = useMutation({
    mutationFn: (number: string) => apiSend<{ members: Member[] }>(path, 'POST', { phone: number }),
    onSuccess: keep,
    onError: (error) => toast.error(error.message || 'We could not add them. Try again in a minute.'),
  });

  const removeMember = useMutation({
    mutationFn: (member: Member) =>
      apiSend<{ members: Member[] }>(`${path}/${encodeURIComponent(member.personId)}`, 'DELETE'),
    onSuccess: (data, member) => {
      keep(data);
      toast.success(`${member.name} is no longer staff.`, {
        action: member.phone ? { label: 'Undo', onClick: () => addMember.mutate(member.phone!) } : undefined,
        duration: 4500,
      });
    },
    onError: (error) => toast.error(error.message || 'We could not remove them. Try again in a minute.'),
  });

  function add(event: FormEvent) {
    event.preventDefault();
    if (!phone.trim()) {
      toast.error('Enter their phone number.');
      return;
    }
    addMember.mutate(phone.trim(), {
      onSuccess: () => {
        setPhone('');
        toast.success('Added as staff. They are told in their notifications.');
      },
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
                  <Button variant="secondary" size="sm" onClick={() => removeMember.mutate(member)}>
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
              <Button type="submit" block loading={addMember.isPending}>
                Add staff
              </Button>
            </Stack>
          </form>
        ) : null}
      </Stack>
    </Panel>
  );
}
