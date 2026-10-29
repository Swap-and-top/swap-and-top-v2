'use client';

/**
 * Verifying a phone: the number, "Send code", then the code. A verified
 * phone is what lets someone post and make offers; it belongs to one account
 * only, which keeps a ban in place (docs/architecture/auth-and-identity.md).
 *
 * `PhoneForm` is the form, in Settings and in the sheet. `VerifyPhoneHost`
 * sits once in the app and shows the sheet whenever something asks for it
 * (requireVerifiedPhone in @snt/core), saying why; once verified, what they
 * were doing carries on.
 *
 * SMS is not set up yet, so no SMS is sent and the code is a mock one, said
 * under the box (MOCK_CODE in apps/api/src/supabaseAdmin.ts).
 */

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  usePhonePromptStore,
  useSessionStore,
  type Viewer,
} from '@snt/core';
import { Button, Field, Sheet, Stack, useCloseSheet } from '@snt/ui';
import { apiSend } from '@/lib/query';
import { toPhone } from '@/lib/supabase';
import { setViewerData } from '@/lib/viewer';
import styles from './VerifyPhone.module.css';

/** The mock code, until real SMS is set up. */
const TEST_CODE = '123456';

/** +263771234567 as people write it: 077 123 4567. */
export const shownPhone = (phone: string) => {
  const local = phone.slice(4);
  return `0${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
};

export function PhoneForm({ onDone }: { onDone?: () => void }) {
  const [typed, setTyped] = useState('');
  /** The number a code went to; the code step shows once it is set. */
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  const verify = useMutation({
    mutationFn: (to: string) => apiSend<Viewer>('/me/phone', 'POST', { phone: to, code: code.trim() }),
    onSuccess: (viewer) => {
      useSessionStore.setState({ viewer });
      setViewerData(queryClient, viewer);
      toast.success('Phone number verified');
      onDone?.();
    },
    onError: (error) => toast.error(error.message || 'We could not verify it. Try again in a minute.'),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!phone) {
      const to = toPhone(typed);
      if (!to) {
        toast.error('Enter a Zimbabwe mobile number, like 077 123 4567.');
        return;
      }
      setCode('');
      setPhone(to);
      return;
    }
    verify.mutate(phone);
  }

  return (
    <form onSubmit={submit}>
      <Stack gap={4}>
        {phone ? (
          <>
            <p className={styles.line}>
              We sent a code by SMS to <strong>{shownPhone(phone)}</strong>.
            </p>
            <Field
              key="code"
              label="Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="e.g. 123456"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            />
            <p className={styles.note}>
              While SMS is being set up, no SMS is sent: the code is {TEST_CODE}.
            </p>
            <Button type="submit" size="lg" block loading={verify.isPending} disabled={code.length < 6}>
              Verify phone number
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              block
              onClick={() => setPhone(null)}
            >
              Change number
            </Button>
          </>
        ) : (
          <>
            <Field
              key="phone"
              label="Phone number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 077 123 4567"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
            <p className={styles.note}>We send you a code by SMS to check it is yours.</p>
            <Button type="submit" size="lg" block>
              Send code
            </Button>
          </>
        )}
      </Stack>
    </form>
  );
}

export function VerifyPhoneHost() {
  const { prompt, close } = usePhonePromptStore();
  if (!prompt) return null;
  return (
    <Sheet narrow title="Verify your phone number" onClose={close}>
      <PhoneSheetBody reason={prompt.reason} then={prompt.then} />
    </Sheet>
  );
}

function PhoneSheetBody({ reason, then }: { reason: string; then?: () => void }) {
  const closeSheet = useCloseSheet();
  return (
    <Stack gap={5}>
      <p className={styles.reason}>{reason}</p>
      <PhoneForm
        onDone={() => {
          closeSheet();
          then?.();
        }}
      />
    </Stack>
  );
}
