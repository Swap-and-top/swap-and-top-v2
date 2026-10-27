/**
 * Deal checks: the ones the signed in person is asked about, and their
 * answers.
 *
 * Three answers only. A "no" means no deal happened: it is not a complaint,
 * carries no consequence, and is never shown to the other party. Complaints go
 * through reporting, which is a separate mechanism with reasons and appeal.
 *
 * Filled from the API once someone is signed in (the web app's accountData),
 * empty for a guest. Answering is optimistic: it shows at once and is put back
 * if the server refuses. The web app connects the server call
 * (connectDealApi); until it does, it simply succeeds.
 */

import { create } from 'zustand';
import { CURRENT_USER_ID } from '../mock/users';
import type { DealAnswer, DealConfirmation } from '../types/deal';
import { viewerId } from './useSessionStore';

interface DealState {
  /** The deal checks they are asked about, newest first. */
  deals: DealConfirmation[];
  /** Whether the API has answered yet. */
  loaded: boolean;
  /** Confirmation id → this person's answer, given on this visit. */
  answers: Record<string, DealAnswer>;
  /** Deals both sides confirmed, on their record. */
  confirmedDeals: number;
  answer: (confirmationId: string, answer: DealAnswer) => void;
  answerFor: (confirmationId: string) => DealAnswer;
}

/** The server's side of deal checks, connected by the web app. Resolves with
    the deal as saved and the person's confirmed deals; rejects if refused. */
export interface DealApi {
  answer: (
    confirmationId: string,
    answer: DealAnswer,
  ) => Promise<{ deal: DealConfirmation; confirmedDeals: number }>;
}

let api: DealApi | null = null;

export function connectDealApi(connected: DealApi) {
  api = connected;
}

export const useDealStore = create<DealState>((set, get) => ({
  deals: [],
  loaded: false,
  answers: {},
  confirmedDeals: 0,
  answer: (confirmationId, given) => {
    const before = get().answers[confirmationId];
    set((state) => ({ answers: { ...state.answers, [confirmationId]: given } }));
    if (!api) return;
    api.answer(confirmationId, given).then(
      ({ deal, confirmedDeals }) =>
        set((state) => ({
          deals: state.deals.map((one) => (one.id === deal.id ? deal : one)),
          confirmedDeals,
        })),
      () =>
        set((state) => {
          const answers = { ...state.answers };
          if (before) answers[confirmationId] = before;
          else delete answers[confirmationId];
          return { answers };
        }),
    );
  },
  answerFor: (confirmationId) => get().answers[confirmationId] ?? 'unanswered',
}));

/** The signed in person. */
const me = () => viewerId() ?? CURRENT_USER_ID;

export function getDealConfirmation(id: string): DealConfirmation | undefined {
  return useDealStore.getState().deals.find((d) => d.id === id);
}

/**
 * Whose side the deal check is shown from: the signed in person's where they
 * are on it; otherwise the listing's owner (a store answering from its
 * console).
 */
export function viewerOn(d: DealConfirmation): string {
  return d.askerId === me() || d.ownerId === me() ? me() : d.ownerId;
}

/** Whether the one answering owns the listing the deal is about. */
export function isOwnerOn(d: DealConfirmation): boolean {
  return d.ownerId === viewerOn(d);
}

/** The other person on the deal. */
export function otherPartyOn(d: DealConfirmation): string {
  return isOwnerOn(d) ? d.askerId : d.ownerId;
}

/**
 * Whether the signed in person has been asked at all. Always on an offer; on
 * a reveal the asker is asked, and the owner only once the asker says yes.
 */
export function isAskedOn(d: DealConfirmation): boolean {
  if (d.askerId === me()) return true;
  if (d.ownerId !== me()) return false;
  return d.source === 'offer' || d.askerAnswer === 'yes';
}

/** The deals the signed in person has been asked about, newest first. */
export function myDeals(deals: DealConfirmation[]): DealConfirmation[] {
  return deals
    .filter(isAskedOn)
    .sort((a, b) => b.promptedAt.localeCompare(a.promptedAt));
}

/** Their answer: what they gave on this visit, else what is saved for their side. */
export function myAnswerOn(
  d: DealConfirmation,
  answers: Record<string, DealAnswer>,
): DealAnswer {
  return answers[d.id] ?? (isOwnerOn(d) ? d.ownerAnswer : d.askerAnswer);
}

/** The other side's answer. Used only to tell whether a yes counts; never
    shown, since a "no" is never shown to the other party. */
export function theirAnswerOn(d: DealConfirmation): DealAnswer {
  return isOwnerOn(d) ? d.askerAnswer : d.ownerAnswer;
}

/** Still waiting on them: not answered, or "not yet". */
export function awaitsMyAnswer(
  d: DealConfirmation,
  answers: Record<string, DealAnswer>,
): boolean {
  const given = myAnswerOn(d, answers);
  return given === 'unanswered' || given === 'not-yet';
}

/** How many deals wait on their answer. */
export function confirmationsAwaiting(
  deals: DealConfirmation[],
  answers: Record<string, DealAnswer>,
): number {
  return myDeals(deals).filter((d) => awaitsMyAnswer(d, answers)).length;
}
