/**
 * The posting flow.
 *
 * One entry point, three outcomes: sell something, swap something, or say what
 * you are looking for. A user should never have to classify their own intent
 * before they start — docs/product/post-flow.md.
 */

import { create } from 'zustand';
import type { CashDirection, Category, ContactChannel } from '../types/listing';

export type PostKind = 'sale' | 'swap' | 'request';

interface PostDraftState {
  kind: PostKind | null;
  category: Category;

  /** What the poster has. Unused for a plain request. */
  haveTitle: string;
  processor: string;
  ram: string;
  storage: string;
  condition: string;
  photoCount: number;

  /** What the poster wants. Used by swap and request. */
  wantTitle: string;

  /** Sale only. */
  price: string;
  /** Request only. */
  budget: string;

  /** Swap only. */
  cashDirection: CashDirection;
  cashAmount: string;

  contactChannels: ContactChannel[];
  /** Whether the listing may appear in dealer lead feeds. Defaults on. */
  allowDealerOffers: boolean;

  setKind: (kind: PostKind) => void;
  setCategory: (category: Category) => void;
  setField: (
    field: Extract<
      keyof PostDraftState,
      | 'haveTitle'
      | 'processor'
      | 'ram'
      | 'storage'
      | 'condition'
      | 'wantTitle'
      | 'price'
      | 'budget'
      | 'cashAmount'
    >,
    value: string,
  ) => void;
  setCashDirection: (direction: CashDirection) => void;
  addPhoto: () => void;
  removePhoto: () => void;
  toggleChannel: (channel: ContactChannel) => void;
  setAllowDealerOffers: (allow: boolean) => void;
  reset: () => void;
}

const initial = {
  kind: null,
  category: 'laptops' as Category,
  haveTitle: 'MacBook Air 2017',
  processor: 'Core i5-5350U',
  ram: '8GB',
  storage: '128GB SSD',
  condition: 'Good',
  photoCount: 2,
  wantTitle: 'Any i7, 16GB, SSD',
  price: '',
  budget: '',
  cashDirection: 'i-add' as CashDirection,
  cashAmount: '240',
  contactChannels: ['whatsapp', 'call'] as ContactChannel[],
  allowDealerOffers: true,
};

export const usePostDraftStore = create<PostDraftState>((set) => ({
  ...initial,
  setKind: (kind) => set({ kind }),
  setCategory: (category) => set({ category }),
  setField: (field, value) => set({ [field]: value } as Partial<PostDraftState>),
  setCashDirection: (cashDirection) => set({ cashDirection }),
  addPhoto: () =>
    set((state) => ({ photoCount: Math.min(8, state.photoCount + 1) })),
  removePhoto: () =>
    set((state) => ({ photoCount: Math.max(0, state.photoCount - 1) })),
  toggleChannel: (channel) =>
    set((state) => ({
      contactChannels: state.contactChannels.includes(channel)
        ? state.contactChannels.filter((c) => c !== channel)
        : [...state.contactChannels, channel],
    })),
  setAllowDealerOffers: (allowDealerOffers) => set({ allowDealerOffers }),
  reset: () => set(initial),
}));

export const CASH_DIRECTION_LABELS: Record<CashDirection, string> = {
  'i-add': 'I add cash',
  'they-add': 'They add cash',
  straight: 'Straight swap',
};

/** The amount field's label changes with direction, so nobody has to infer it. */
export const CASH_AMOUNT_LABELS: Record<CashDirection, string> = {
  'i-add': 'How much will you add?',
  'they-add': 'How much should they add?',
  straight: 'No cash either way',
};
