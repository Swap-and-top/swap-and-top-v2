'use client';

/**
 * A data request, on a user's page, for Trust and safety leaders: Download
 * their data, as one file (GET /api/staff/users/{id}/data), or Delete their
 * account (POST /api/staff/users/{id}/delete), which asks for a note and
 * cannot be undone. See apps/api/src/routes/dataRequests.ts for what each
 * does and when it is refused.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Sheet, Stack } from '@snt/ui';
import { apiGet, apiSend } from '@/lib/query';
import styles from '../page.module.css';
import record from './record.module.css';
import type { PersonRecord } from './shared';

export function DataRequestSheet({ person, onClose }: { person: PersonRecord; onClose: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const download = useMutation({
    mutationFn: () => apiGet<Record<string, unknown>>(`/staff/users/${encodeURIComponent(person.id)}/data`),
    onSuccess: (data) => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Swap and Top data, ${person.name.replace(/[^\p{L}\p{N} ]/gu, '')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      // The download is in the log.
      void queryClient.invalidateQueries({ queryKey: ['staff', 'activity'] });
      toast.success('Their data has been downloaded.');
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () =>
      apiSend(`/staff/users/${encodeURIComponent(person.id)}/delete`, 'POST', { note: note.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`${person.name}’s account has been deleted.`);
      router.push('/staff/users');
    },
    onError: (error) => toast.error(error.message),
  });

  const owned = person.stores.filter((store) => store.role === 'owner');

  if (deleting) {
    return (
      <Sheet narrow title={`Delete ${person.name}’s account`} onClose={onClose}>
        <Stack gap={4}>
          <p className={styles.lead}>
            Their name, phone number, email, area and sign in are removed, and their listings come
            down. Deals, reports and payments stay on record under “Deleted user”.
            {owned.length ? ` ${owned.map((store) => store.name).join(', ')} will close too.` : ''} This
            can’t be undone.
          </p>
          <label className={styles.field}>
            <span className={styles.label}>Why you are deleting it</span>
            <textarea
              className={styles.textarea}
              rows={3}
              maxLength={500}
              placeholder="e.g. They asked by email on 30 Oct and confirmed from their number."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          {/* A note saying why is required: off until there is one. */}
          <Button
            size="lg"
            block
            className={record.deleteConfirm}
            disabled={note.trim().length < 2}
            loading={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Delete their account
          </Button>
          <Button variant="secondary" size="lg" block onClick={() => setDeleting(false)}>
            Keep the account
          </Button>
        </Stack>
      </Sheet>
    );
  }

  return (
    <Sheet narrow title="Data request" onClose={onClose}>
      <Stack gap={4}>
        <p className={styles.lead}>
          For when {person.name} asks for their data, or asks us to delete their account. Each is in
          the Activity log.
        </p>
        <Button size="lg" block loading={download.isPending} onClick={() => download.mutate()}>
          Download their data
        </Button>
        <Button
          variant="secondary"
          size="lg"
          block
          className={record.deleteButton}
          disabled={Boolean(person.cannotDelete)}
          onClick={() => setDeleting(true)}
        >
          Delete their account
        </Button>
        {person.cannotDelete ? <p className={styles.lead}>{person.cannotDelete}</p> : null}
        <Button variant="secondary" size="lg" block onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Sheet>
  );
}
