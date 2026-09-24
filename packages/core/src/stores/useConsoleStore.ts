/**
 * Dealer console state.
 *
 * One responsive surface: at phone width it is a stacked list with a bottom
 * nav, and from the `lg` breakpoint up it gains a sidebar and a real table.
 * Mobile is the primary build — most small shops are run from a phone behind a
 * counter, and nobody opens a laptop to add one item.
 */

import { create } from 'zustand';
import type { LeadTab } from '../types/lead';
import type { ListingStatus } from '../types/listing';

export type StockFilter = 'all' | ListingStatus;

interface ConsoleState {
  leadTab: LeadTab;
  /** Which lead is open in the desktop two-pane view. */
  activeLeadId: string | null;
  stockQuery: string;
  stockFilter: StockFilter;
  /** Offer composer, on the desktop lead detail pane. */
  offerPrice: string;
  offerMessage: string;
  setLeadTab: (tab: LeadTab) => void;
  setActiveLead: (leadId: string | null) => void;
  setStockQuery: (query: string) => void;
  setStockFilter: (filter: StockFilter) => void;
  setOfferPrice: (price: string) => void;
  setOfferMessage: (message: string) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  leadTab: 'matching',
  activeLeadId: 'lead-1',
  stockQuery: '',
  stockFilter: 'all',
  offerPrice: '$255',
  offerMessage:
    'I have the Latitude 7490. Bring the Air in and we can do $255 on top.',
  setLeadTab: (leadTab) => set({ leadTab }),
  setActiveLead: (activeLeadId) => set({ activeLeadId }),
  setStockQuery: (stockQuery) => set({ stockQuery }),
  setStockFilter: (stockFilter) => set({ stockFilter }),
  setOfferPrice: (offerPrice) => set({ offerPrice }),
  setOfferMessage: (offerMessage) => set({ offerMessage }),
}));

export const LEAD_TAB_LABELS: Record<LeadTab, string> = {
  matching: 'Matching requests',
  reveals: 'Number reveals',
  offers: 'Offers sent',
};
