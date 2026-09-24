/**
 * Deal confirmation answers.
 *
 * Three answers only. A "no" means no deal happened — it is not a complaint,
 * carries no consequence, and is never shown to the other party. Complaints go
 * through reporting, which is a separate mechanism with reasons and appeal.
 */

import { create } from 'zustand';
import type { DealAnswer } from '../types/deal';

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
       * In the real system the count only rises when BOTH sides say yes. Here
       * the counterparty has already confirmed, so a yes completes it.
       */
      confirmedDeals:
        answer === 'yes' && state.answers[confirmationId] !== 'yes'
          ? state.confirmedDeals + 1
          : state.confirmedDeals,
    })),
  answerFor: (confirmationId) =>
    get().answers[confirmationId] ?? 'unanswered',
}));
