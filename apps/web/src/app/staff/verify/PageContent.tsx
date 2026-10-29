'use client';

/**
 * Verify stores, a section of the Staff console, for Trust and safety leads
 * (and the super admin): the stores asking for Verified store, oldest
 * first (GET /api/admin/verifications). Each shows what the owner gave and
 * their number, to call them, see the documents and arrange a video call or
 * visit. Then Verify, or Decline with a reason the owner is told
 * (POST /api/admin/verifications/{id}).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Bone, Button, ButtonLink, Panel, Sheet, Stack } from '@snt/ui';
import { refreshStore } from '@/lib/refresh';
import { apiGet, apiSend, QueryProblem } from '@/lib/query';
import { useInDepartment } from '@/lib/staff';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
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
  /** The request being declined, while its reason is asked for. */
  const [declining, setDeclining] = useState<Pending | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const waiting = useQuery({
    queryKey: staffKeys.verify,
    queryFn: () => apiGet<{ requests: Pending[] }>('/admin/verifications').then((data) => data.requests),
    enabled: admin,
  });
  const requests = waiting.data;

  const decideMutation = useMutation({
    mutationFn: async ({ request, decision, note }: { request: Pending; decision: 'approve' | 'decline'; note?: string }) => {
      await apiSend(`/admin/verifications/${encodeURIComponent(request.id)}`, 'POST', { decision, note });
      // The store's page shows the badge at once, not when its minute is up.
      if (decision === 'approve') await refreshStore(request.storeSlug);
    },
    onSuccess: (_, { request, decision }) => {
      queryClient.setQueryData<Pending[]>(staffKeys.verify, (list) => list?.filter((item) => item.id !== request.id));
      setDeclining(null);
      setReason('');
      toast.success(
        decision === 'approve'
          ? `${request.storeName} is now a Verified store.`
          : `${request.storeName} was declined. The owner has been told why.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });
  const decide = (request: Pending, decision: 'approve' | 'decline', note?: string) =>
    decideMutation.mutate({ request, decision, note });
  /** The request being decided, so its buttons wait. */
  const busy = decideMutation.isPending ? decideMutation.variables?.request.id : null;

  return (
    <StaffPage title="Verify stores" meta="Stores asking for the Verified store badge">
          <Stack gap={6}>
            {allowed === false ? (
              <Panel padded>
                <p className={styles.lead}>Only Trust and safety leads can verify stores.</p>
              </Panel>
            ) : waiting.isError ? (
              <QueryProblem error={waiting.error} onRetry={() => void waiting.refetch()} />
            ) : !requests ? (
              <Panel padded>
                <Stack gap={5}>
                  <Bone width={180} height={22} />
                  <Bone height={70} />
                  <Bone shape="pill" height={44} />
                </Stack>
              </Panel>
            ) : requests.length === 0 ? (
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
                          onClick={() => decide(request, 'approve')}
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
                    onClick={() => decide(declining, 'decline', reason.trim())}
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
    </StaffPage>
  );
}
