/**
 * Mock dealer leads.
 *
 * A lead is a swap or request listing matched against the dealer's stock. The
 * match line — "matches your Dell Latitude 7490" — is what turns a
 * notification into a tool, so it is part of the shape rather than an extra.
 */

import type { Lead } from '../types/lead';
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
  },
  {
    id: 'lead-2',
    demand: demand('l-rtx-wanted'),
    requester: getUser('u-blessing') ?? fallbackUser,
    isNew: true,
    receivedAt: '1 hour ago',
    area: 'Harare',
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
  },
  {
    id: 'lead-4',
    demand: demand('l-cad-desktop-wanted'),
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
