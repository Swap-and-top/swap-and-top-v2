/**
 * Deal confirmation.
 *
 * Three days after a reveal, both parties are asked one question. When both say
 * yes it becomes a confirmed deal — the trust signal for private sellers, and
 * the platform's only view of settlement.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDealConfirmation, mockDealConfirmations } from '@snt/core';
import { DealConfirm } from '@/components/DealConfirm';

export const metadata: Metadata = { title: 'Deal check · Swap & Top' };

export function generateStaticParams() {
  return mockDealConfirmations.map((item) => ({ id: item.id }));
}

export default async function DealConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const confirmation = getDealConfirmation(id);

  if (!confirmation) notFound();

  return <DealConfirm confirmation={confirmation} />;
}
