/**
 * The shop's lead alert settings (see types/leadAlerts.ts), kept here as a
 * stand in for the backend: the sheet reads and saves them, the chip on
 * Leads shows how they stand. Confirming a WhatsApp number is mocked: any
 * six digit code is taken.
 */

import { create } from 'zustand';
import type { LeadAlertSettings } from '../types/leadAlerts';

export const DEFAULT_LEAD_ALERTS: LeadAlertSettings = {
  enabled: true,
  whatsapp: { on: true, number: '+263 77 412 8890', confirmed: true },
  match: 'stock',
  categories: [],
  includeSwaps: true,
  minBudget: null,
  quietHours: { on: true, from: '21:00', to: '07:00' },
  lastSentLabel: '12 minutes ago',
};

interface LeadAlertState {
  settings: LeadAlertSettings;
  save: (settings: LeadAlertSettings) => void;
}

export const useLeadAlertStore = create<LeadAlertState>((set) => ({
  settings: DEFAULT_LEAD_ALERTS,
  save: (settings) => set({ settings }),
}));
