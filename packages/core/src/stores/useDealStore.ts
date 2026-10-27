/**
 * Deal confirmation answers.
 *
 * Three answers only. A "no" means no deal happened — it is not a complaint,
 * carries no consequence, and is never shown to the other party. Complaints go
 * through reporting, which is a separate mechanism with reasons and appeal.
 */

import { create } from 'zustand';
import type { DealAnswer } from '../types/deal';
import { getDealConfirmation, theirAnswerOn } from '../mock/deals';
import { CURRENT_USER_ID } from '../mock/users';

interface DealState {
  /** Confirmation id → this user's answer. */
  answers: Record<string, DealAnswer>;
  /** Confirmed deals the current user has, shown on their listings. */
  confirmedDeals: number;
  answer: (confirmationId: string, answer: DealAnswer) => void;
  answerFor: (confirmationId: string) => DealAnswer;
}

export const useDealStore = create<DealState>((set, get) => ({
  answers: {},
  confirmedDeals: 3,
  answer: (confirmationId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [confirmationId]: answer },
      /**
       * A deal counts only when both sides say yes. The other side's answer
       * is already in the mock, so a yes counts only where they said yes.
       */
      confirmedDeals:
        answer === 'yes' &&
        state.answers[confirmationId] !== 'yes' &&
        bothYes(confirmationId)
          ? state.confirmedDeals + 1
          : state.confirmedDeals,
    })),
  answerFor: (confirmationId) =>
    get().answers[confirmationId] ?? 'unanswered',
}));

/** Whether the other side of this deal has already said yes, on one of the
    signed in user's own deals: a store's answer counts on the store, not here. */
function bothYes(confirmationId: string): boolean {
  const deal = getDealConfirmation(confirmationId);
  if (!deal) return false;
  const mine =
    deal.askerId === CURRENT_USER_ID || deal.ownerId === CURRENT_USER_ID;
  return mine && theirAnswerOn(deal) === 'yes';
}
