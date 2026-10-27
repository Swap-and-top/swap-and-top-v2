/**
 * Dealer console state.
 *
 * One responsive surface: at phone width it is a stacked list with a bottom
 * nav, and from the `lg` breakpoint up it gains a sidebar and a real table.
 * Mobile is the primary build — most small shops are run from a phone behind a
 * counter, and nobody opens a laptop to add one item.
 */

import { create } from 'zustand';
import type { ConsoleOffersTab, LeadTab } from '../types/lead';
import type { Category, ListingStatus } from '../types/listing';

export type StockFilter = 'all' | ListingStatus;

/** How the stock list is ordered. */
export type StockSort = 'newest' | 'price-low' | 'price-high' | 'reveals';

export const STOCK_SORT_LABELS: Record<StockSort, string> = {
  newest: 'Newest first',
  'price-low': 'Price, lowest first',
  'price-high': 'Price, highest first',
  reveals: 'Most reveals',
};

/** The stock list's filters, as the Filters sheet sets them. */
export interface StockFilters {
  status: StockFilter;
  category: 'all' | Category;
  sort: StockSort;
  /** Only items that take a trade in. */
  swapsOnly: boolean;
}

export const NO_STOCK_FILTERS: StockFilters = {
  status: 'all',
  category: 'all',
  sort: 'newest',
  swapsOnly: false,
};

/** Stock's two tabs: everything the shop holds, and what is boosted. */
export type StockTab = 'stock' | 'boosted';

interface ConsoleState {
  leadTab: LeadTab;
  /** The Offers page's tab: kept, so "See it" after sending an offer from
      Leads can open it on Sent. */
  offersTab: ConsoleOffersTab;
  /** Which lead is open in the desktop two-pane view. */
  activeLeadId: string | null;
  stockQuery: string;
  stockFilter: StockFilter;
  stockFilters: StockFilters;
  /** Stock's tab: kept, so Stats' "Boosted listings" can open it there. */
  stockTab: StockTab;
  /** The desktop sidebar folded to its icons. Kept as the dealer moves on. */
  sidebarCollapsed: boolean;
  /** Offer composer, on the desktop lead detail pane. */
  offerPrice: string;
  offerMessage: string;
  setLeadTab: (tab: LeadTab) => void;
  setOffersTab: (tab: ConsoleOffersTab) => void;
  setActiveLead: (leadId: string | null) => void;
  setStockQuery: (query: string) => void;
  setStockFilter: (filter: StockFilter) => void;
  setStockFilters: (filters: StockFilters) => void;
  setStockTab: (tab: StockTab) => void;
  toggleSidebar: () => void;
  setOfferPrice: (price: string) => void;
  setOfferMessage: (message: string) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  leadTab: 'matching',
  offersTab: 'received',
  activeLeadId: 'lead-1',
  stockQuery: '',
  stockFilter: 'all',
  stockFilters: NO_STOCK_FILTERS,
  stockTab: 'stock',
  sidebarCollapsed: false,
  offerPrice: '$255',
  offerMessage:
    'I have the Latitude 7490. Bring the Air in and we can do $255 on top.',
  setLeadTab: (leadTab) => set({ leadTab }),
  setOffersTab: (offersTab) => set({ offersTab }),
  setActiveLead: (activeLeadId) => set({ activeLeadId }),
  setStockQuery: (stockQuery) => set({ stockQuery }),
  setStockFilter: (stockFilter) => set({ stockFilter }),
  setStockFilters: (stockFilters) => set({ stockFilters }),
  setStockTab: (stockTab) => set({ stockTab }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setOfferPrice: (offerPrice) => set({ offerPrice }),
  setOfferMessage: (offerMessage) => set({ offerMessage }),
}));

export const LEAD_TAB_LABELS: Record<LeadTab, string> = {
  matching: 'Matching requests',
  reveals: 'Number reveals',
};
