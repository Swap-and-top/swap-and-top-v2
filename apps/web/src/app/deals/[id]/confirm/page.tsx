/**
 * Deal confirmation.
 *
 * Three days after a reveal, both parties are asked one question. When both say
 * yes it becomes a confirmed deal — the trust signal for private sellers, and
 * the platform's only view of settlement.
 *
 * Each deal check belongs to the two people on it, so the page is found in
 * the browser among the signed in person's own (DealConfirmRoute).
 */

import type { Metadata } from 'next';
import { DealConfirmRoute } from '@/components/DealConfirmRoute';
import { slowDown } from '@/components/slowDown';

export const metadata: Metadata = { title: 'Deal check · Swap & Top' };

export default async function DealConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await slowDown();
  const { id } = await params;
  // The deal is the signed in person's, so it is found in the browser.
  return <DealConfirmRoute id={id} />;
}
