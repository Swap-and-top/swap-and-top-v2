'use client';

/**
 * Asks someone who joined by phone for their name, the first time they are
 * in: phone sign in makes the account without one. Shown as first name and
 * surname initial, as everyone's is. "Not now" puts it off until the next
 * visit.
 */

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSessionStore, type Viewer } from '@snt/core';
import { Button, Field, Sheet, Stack, useCloseSheet } from '@snt/ui';
import { apiSend } from '@/lib/query';
import { setViewerData } from '@/lib/viewer';
import styles from './VerifyPhone.module.css';

export function AskName() {
  const viewer = useSessionStore((state) => state.viewer);
  const [later, setLater] = useState(false);
  if (!viewer || viewer.displayName || later) return null;
  return (
    <Sheet narrow title="What is your name?" onClose={() => setLater(true)}>
      <NameForm />
    </Sheet>
  );
}

function NameForm() {
  const closeSheet = useCloseSheet();
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const queryClient = useQueryClient();

  const saveName = useMutation({
    mutationFn: () =>
      apiSend<Viewer>('/me', 'PATCH', { firstName: firstName.trim(), surname: surname.trim() }),
    onSuccess: (viewer) => {
      // Who they are, as just saved: the session and its query both.
      useSessionStore.setState({ viewer });
      setViewerData(queryClient, viewer);
      toast.success('Name saved');
      closeSheet();
    },
    onError: (error) => toast.error(error.message || 'We could not save it. Try again in a minute.'),
  });

  function save(event: FormEvent) {
    event.preventDefault();
    if (!firstName.trim() || !surname.trim()) {
      toast.error('Enter your first name and surname.');
      return;
    }
    saveName.mutate();
  }

  return (
    <form onSubmit={save}>
      <Stack gap={4}>
        <p className={styles.reason}>
          Others see your first name and the first letter of your surname.
        </p>
        <Field
          label="First name"
          autoComplete="given-name"
          placeholder="e.g. Tarisai"
          autoFocus
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <Field
          label="Surname"
          autoComplete="family-name"
          placeholder="e.g. Moyo"
          value={surname}
          onChange={(event) => setSurname(event.target.value)}
        />
        <Button type="submit" size="lg" block loading={saveName.isPending}>
          Save
        </Button>
        <Button type="button" variant="secondary" size="lg" block onClick={closeSheet}>
          Not now
        </Button>
      </Stack>
    </form>
  );
}
