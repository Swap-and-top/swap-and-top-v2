'use client';

/**
 * Verify stores, for Trust and safety leads (and the super admin): the
 * stores asking for Verified store, oldest
 * first (GET /api/admin/verifications). Each shows what the owner gave and
 * their number, to call them, see the documents and arrange a video call or
 * visit. Then Verify, or Decline with a reason the owner is told
 * (POST /api/admin/verifications/{id}).
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AppHeader,
  Button,
  ButtonLink,
  Footer,
  Panel,
  Screen,
  ScreenBody,
  Sheet,
  SignInGate,
  Stack,
} from '@snt/ui';
import { refreshStore } from '@/lib/refresh';
import { useInDepartment } from '@/lib/staff';
import { apiAsViewer } from '@/lib/supabase';
import styles from './page.module.css';

interface Pending {
  id: string;
  storeName: string;
  storeSlug: string;
  location: string;
  ownerName: string;
  ownerPhone?: string;
  kind: 'registered' | 'informal';
  reference: string;
  askedLabel: string;
}

const KIND_LABEL = {
  registered: 'Registered business',
  informal: 'Informal trader',
} as const;

export default function VerifyStoresPage() {
  /** Trust and safety leads verify stores (and the super admin). */
  const allowed = useInDepartment('trust_safety', true);
  const admin = allowed === true;
  const [requests, setRequests] = useState<Pending[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  /** The request being declined, while its reason is asked for. */
  const [declining, setDeclining] = useState<Pending | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!admin) return;
    let gone = false;
    void apiAsViewer<{ requests: Pending[] }>('/admin/verifications', { method: 'GET' }).then(
      ({ data, error }) => {
        if (gone) return;
        if (error) toast.error(error);
        setRequests(data?.requests ?? []);
      },
    );
    return () => {
      gone = true;
    };
  }, [admin]);

  async function decide(request: Pending, decision: 'approve' | 'decline', note?: string) {
    setBusy(request.id);
    const { error } = await apiAsViewer(`/admin/verifications/${encodeURIComponent(request.id)}`, {
      method: 'POST',
      body: { decision, note },
    });
    setBusy(null);
    if (error) {
      toast.error(error);
      return;
    }
    // The store's page shows the badge at once, not when its minute is up.
    if (decision === 'approve') await refreshStore(request.storeSlug);
    setRequests((list) => list?.filter((item) => item.id !== request.id) ?? null);
    setDeclining(null);
    setReason('');
    toast.success(
      decision === 'approve'
        ? `${request.storeName} is now a Verified store.`
        : `${request.storeName} was declined. The owner has been told why.`,
    );
  }

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <h1 className={styles.title}>Verify stores</h1>
            {allowed === undefined ? null : !admin ? (
              <Panel padded>
                <p className={styles.lead}>Only Trust and safety leads can verify stores.</p>
              </Panel>
            ) : requests === null ? null : requests.length === 0 ? (
              <Panel padded>
                <p className={styles.lead}>No stores are waiting to be verified.</p>
              </Panel>
            ) : (
              <>
                <p className={styles.lead}>
                  Call each owner to see their documents (the registration certificate or
                  licence, and their ID) and a photo or short video call of the shop. Then
                  verify the store, or decline it and say why.
                </p>
                {requests.map((request) => (
                  <Panel padded key={request.id}>
                    <Stack gap={5}>
                      <h2 className={styles.store}>{request.storeName}</h2>
                      <dl className={styles.facts}>
                        <dt>Owner</dt>
                        <dd>{request.ownerName || 'No name yet'}</dd>
                        <dt>Phone</dt>
                        <dd>
                          {request.ownerPhone ? (
                            <a href={`tel:+263${request.ownerPhone.replace(/\D/g, '').slice(1)}`}>
                              {request.ownerPhone}
                            </a>
                          ) : (
                            'None given'
                          )}
                        </dd>
                        <dt>Business</dt>
                        <dd>{KIND_LABEL[request.kind]}</dd>
                        <dt>{request.kind === 'registered' ? 'Registration' : 'Licence'}</dt>
                        <dd>{request.reference}</dd>
                        <dt>Area</dt>
                        <dd>{request.location}</dd>
                        <dt>Asked</dt>
                        <dd>{request.askedLabel}</dd>
                      </dl>
                      <ButtonLink href={`/store/${request.storeSlug}`} variant="secondary" block>
                        View the store
                      </ButtonLink>
                      <div className={styles.actions}>
                        <Button
                          variant="secondary"
                          onClick={() => setDeclining(request)}
                          disabled={busy === request.id}
                        >
                          Decline
                        </Button>
                        <Button
                          loading={busy === request.id}
                          onClick={() => void decide(request, 'approve')}
                        >
                          Verify
                        </Button>
                      </div>
                    </Stack>
                  </Panel>
                ))}
              </>
            )}
            {declining ? (
              <Sheet narrow title={`Decline ${declining.storeName}`} onClose={() => setDeclining(null)}>
                <Stack gap={4}>
                  <p className={styles.lead}>Tell the owner why, so they know what to fix.</p>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    maxLength={300}
                    placeholder="e.g. The licence number does not match the council records."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <Button
                    size="lg"
                    block
                    disabled={!reason.trim()}
                    loading={busy === declining.id}
                    onClick={() => void decide(declining, 'decline', reason.trim())}
                  >
                    Decline
                  </Button>
                  <Button variant="secondary" size="lg" block onClick={() => setDeclining(null)}>
                    Cancel
                  </Button>
                </Stack>
              </Sheet>
            ) : null}
          </Stack>
        </SignInGate>
      </ScreenBody>
      <Footer />
    </Screen>
  );
}
