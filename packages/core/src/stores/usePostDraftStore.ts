/**
 * The posting flow.
 *
 * One entry point, three outcomes: sell something, swap something, or say what
 * you are looking for. A user should never have to classify their own intent
 * before they start — docs/product/post-flow.md.
 */

import { create } from 'zustand';
import type {
  CashDirection,
  Category,
  ContactChannel,
  ContactShownTo,
  ItemSpecs,
} from '../types/listing';

export type PostKind = 'sale' | 'swap' | 'request';

interface PostDraftState {
  kind: PostKind | null;
  /**
   * Who it goes up as, for someone with a store: a store's id, or null for
   * themselves. Undefined until they choose, which means their first store.
   */
  postAs: string | null | undefined;
  /** None until they pick one: nothing is chosen for them. */
  category: Category | null;

  /** What the poster has. Unused for a plain request. */
  haveTitle: string;
  /**
   * Its details, by key. The form asks only for those its category needs
   * (processor and RAM for a laptop, type and capacity for a part); values
   * typed for another category are kept but not used.
   */
  specs: ItemSpecs;
  condition: string;
  photoCount: number;

  /** What the poster wants. Used by swap and request. */
  wantTitle: string;

  /** Sale only. */
  price: string;
  /** Request only. */
  budget: string;

  /** Swap only. None until they pick which way the cash goes. */
  cashDirection: CashDirection | null;
  cashAmount: string;
  /** Swap only, when they add cash: the amount is a ceiling, "up to". */
  cashUpTo: boolean;
  /** Sale only: they would take a trade-in towards it ("Swaps accepted"). */
  acceptsSwaps: boolean;

  contactChannels: ContactChannel[];
  /** Whether the listing may appear in store lead feeds. Defaults on. */
  allowStoreOffers: boolean;
  /** Whether only signed-in users may see the number. Defaults off. */
  contactSignedInOnly: boolean;
  /** Who sees the details: everyone, or only those whose offer is
      accepted. Starts on everyone, the first choice. */
  contactShownTo: ContactShownTo;
  /** With offers first: stores may still see the details. Defaults off. */
  contactToStores: boolean;

  setKind: (kind: PostKind) => void;
  setPostAs: (postAs: string | null) => void;
  setCategory: (category: Category) => void;
  setField: (
    field: Extract<
      keyof PostDraftState,
      | 'haveTitle'
      | 'condition'
      | 'wantTitle'
      | 'price'
      | 'budget'
      | 'cashAmount'
    >,
    value: string,
  ) => void;
  setCashDirection: (direction: CashDirection) => void;
  setSpec: (key: keyof ItemSpecs, value: string) => void;
  setCashUpTo: (upTo: boolean) => void;
  setAcceptsSwaps: (accepts: boolean) => void;
  addPhoto: () => void;
  removePhoto: () => void;
  toggleChannel: (channel: ContactChannel) => void;
  setAllowStoreOffers: (allow: boolean) => void;
  setContactSignedInOnly: (only: boolean) => void;
  setContactShownTo: (shownTo: ContactShownTo) => void;
  setContactToStores: (toStores: boolean) => void;
  reset: () => void;
}

/**
 * A new post starts with nothing typed or added for them: every text box
 * shows only a faded example of what goes in it. Every choice starts on its
 * first option, so something is always chosen: the first category, the
 * first condition, "I pay", WhatsApp, and store offers on.
 */
const initial = {
  kind: null,
  postAs: undefined as string | null | undefined,
  category: 'laptops' as Category | null,
  haveTitle: '',
  specs: {} as ItemSpecs,
  // A condition's key, as the condition dropdown offers them, once chosen.
  condition: 'boxed-new',
  photoCount: 0,
  wantTitle: '',
  price: '',
  budget: '',
  cashDirection: 'i-add' as CashDirection | null,
  cashAmount: '',
  cashUpTo: false,
  acceptsSwaps: false,
  contactChannels: ['whatsapp'] as ContactChannel[],
  allowStoreOffers: true,
  contactSignedInOnly: false,
  contactShownTo: 'everyone' as ContactShownTo,
  contactToStores: false,
};

export const usePostDraftStore = create<PostDraftState>((set) => ({
  ...initial,
  setKind: (kind) => set({ kind }),
  setPostAs: (postAs) => set({ postAs }),
  setCategory: (category) => set({ category }),
  setField: (field, value) => set({ [field]: value } as Partial<PostDraftState>),
  setCashDirection: (cashDirection) => set({ cashDirection }),
  setSpec: (key, value) =>
    set((state) => ({ specs: { ...state.specs, [key]: value } })),
  setCashUpTo: (cashUpTo) => set({ cashUpTo }),
  setAcceptsSwaps: (acceptsSwaps) => set({ acceptsSwaps }),
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
  setAllowStoreOffers: (allowStoreOffers) => set({ allowStoreOffers }),
  setContactSignedInOnly: (contactSignedInOnly) => set({ contactSignedInOnly }),
  setContactShownTo: (contactShownTo) => set({ contactShownTo }),
  setContactToStores: (contactToStores) => set({ contactToStores }),
  reset: () => set(initial),
}));

export const CASH_DIRECTION_LABELS: Record<CashDirection, string> = {
  'i-add': 'I pay',
  'they-add': 'They pay',
  straight: 'Straight swap',
};

/** The amount field's label changes with direction, so nobody has to infer it. */
export const CASH_AMOUNT_LABELS: Record<CashDirection, string> = {
  'i-add': 'How much will you pay?',
  'they-add': 'How much should they pay?',
  straight: 'No cash either way',
};
