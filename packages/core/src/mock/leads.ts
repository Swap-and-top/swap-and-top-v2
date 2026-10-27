/**
 * Mock store leads.
 *
 * A lead is a swap or request listing matched against the store's stock. The
 * match line — "matches your Dell Latitude 7490" — is what turns a
 * notification into a tool, so it is part of the shape rather than an extra.
 */

import type { Lead, NumberReveal } from '../types/lead';
import type { DemandListing } from '../types/listing';
import { mockListings } from './listings';
import { getUser, mockUsers } from './users';

function demand(id: string): DemandListing {
  const found = mockListings.find(
    (l) => l.id === id && (l.type === 'swap' || l.type === 'request'),
  );
  if (!found) throw new Error(`mock lead references unknown demand: ${id}`);
  return found as DemandListing;
}

const fallbackUser = mockUsers[0]!;

export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    demand: demand('l-macbook-swap'),
    requester: getUser('u-tarisai') ?? fallbackUser,
    matchedStockId: 'l-dell-latitude-7490',
    matchedStockLabel: 'Dell Latitude 7490',
    coversAmount: 240,
    isNew: true,
    receivedAt: '12 minutes ago',
    area: 'Mt Pleasant',
    alert: { via: ['whatsapp', 'inApp'], at: '10:42' },
  },
  {
    id: 'lead-2',
    demand: demand('l-rtx-wanted'),
    requester: getUser('u-blessing') ?? fallbackUser,
    isNew: true,
    receivedAt: '1 hour ago',
    area: 'Harare',
    alert: { via: ['whatsapp', 'inApp'], at: '09:51' },
  },
  {
    id: 'lead-3',
    demand: demand('l-redmi-wanted'),
    requester: getUser('u-rudo') ?? fallbackUser,
    matchedStockId: 'l-redmi-note-12',
    matchedStockLabel: 'Redmi Note 12 128GB',
    isNew: false,
    receivedAt: 'Yesterday',
    area: 'Mt Pleasant',
    // Posted in quiet hours: in the app at once, WhatsApp held till morning.
    alert: { via: ['inApp'], at: 'Yesterday, 21:40' },
  },
  {
    id: 'lead-4',
    demand: demand('l-cad-desktop-swap'),
    requester: getUser('u-blessing') ?? fallbackUser,
    isNew: false,
    receivedAt: 'Yesterday',
    area: 'Belvedere',
  },
  {
    id: 'lead-5',
    demand: demand('l-sodimm-wanted'),
    requester: getUser('u-rudo') ?? fallbackUser,
    isNew: false,
    receivedAt: '2 days ago',
    area: 'Avondale',
  },
];

export function getLead(id: string): Lead | undefined {
  return mockLeads.find((l) => l.id === id);
}

export const newLeadCount = mockLeads.filter((l) => l.isNew).length;

/** Who revealed the store's number lately, newest first. */
export const mockStoreReveals: NumberReveal[] = [
  {
    id: 'rv-1',
    userId: 'u-tendai',
    listingId: 'l-dell-latitude-7490',
    way: 'whatsapp',
    atLabel: '25 minutes ago',
    area: 'Borrowdale',
    deal: 'waiting',
    daysToAsk: 3,
  },
  {
    id: 'rv-2',
    userId: 'u-nyasha',
    listingId: 'l-thinkpad-t480',
    way: 'call',
    atLabel: '2 hours ago',
    area: 'Avondale',
    deal: 'waiting',
    daysToAsk: 3,
  },
  {
    id: 'rv-3',
    userId: 'u-rudo',
    listingId: 'l-redmi-note-12',
    way: 'whatsapp',
    atLabel: 'Yesterday',
    area: 'Mt Pleasant',
    deal: 'waiting',
    daysToAsk: 2,
  },
  {
    id: 'rv-4',
    userId: 'u-farai',
    listingId: 'l-hp-elitebook-840',
    way: 'whatsapp',
    atLabel: '3 days ago',
    area: 'Harare CBD',
    deal: 'asked',
    dealId: 'dc-8',
  },
  {
    id: 'rv-5',
    userId: 'u-chipo',
    listingId: 'l-rx-580',
    way: 'call',
    atLabel: 'Last week',
    area: 'Belvedere',
    deal: 'confirmed',
  },
  {
    id: 'rv-6',
    userId: 'u-blessing',
    listingId: 'l-hp-elitedesk-800',
    way: 'whatsapp',
    atLabel: 'Last week',
    area: 'Harare',
    deal: 'confirmed',
  },
];
