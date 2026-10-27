/** Mock stores. Names are placeholders. */

import type { Store } from '../types/store';

export const mockStores: Store[] = [
  {
    id: 's-kopje',
    slug: 'kopje-computers',
    name: 'Kopje Computers',
    initials: 'KC',
    description: 'Laptops, desktops and parts. Swaps welcome.',
    location: 'Harare CBD',
    openingHours: 'Mon to Sat, 8am to 5pm',
    verified: true,
    stockCount: 42,
    confirmedDeals: 31,
    replyHours: 1,
    joinedAt: '2024-03-11',
  },
  {
    id: 's-samora',
    slug: 'samora-mobile',
    name: 'Samora Mobile',
    initials: 'SM',
    description: 'Phones, new and used. Screen repairs while you wait.',
    location: 'Harare CBD',
    openingHours: 'Mon to Sat, 8:30am to 6pm',
    verified: true,
    stockCount: 28,
    confirmedDeals: 19,
    replyHours: 1,
    joinedAt: '2025-01-20',
  },
  {
    id: 's-msasa',
    slug: 'msasa-pc-parts',
    name: 'Msasa PC Parts',
    initials: 'MP',
    description: 'Memory, drives and graphics cards. Builds and upgrades.',
    location: 'Msasa',
    openingHours: 'Mon to Fri, 8am to 5pm; Sat, 9am to 1pm',
    verified: true,
    stockCount: 64,
    confirmedDeals: 12,
    replyHours: 2,
    joinedAt: '2025-06-02',
  },
  {
    /** Not yet verified — the store row shows no badge, only the name. */
    id: 's-avondale-games',
    slug: 'avondale-games',
    name: 'Avondale Games',
    initials: 'AG',
    description: 'Consoles, controllers and games. Swaps accepted.',
    location: 'Avondale',
    openingHours: 'Mon to Sat, 9am to 5pm',
    verified: false,
    stockCount: 15,
    confirmedDeals: 4,
    replyHours: 3,
    joinedAt: '2026-05-14',
  },
];

export function getStore(id: string | undefined): Store | undefined {
  if (!id) return undefined;
  return mockStores.find((s) => s.id === id);
}

export function getStoreBySlug(slug: string): Store | undefined {
  return mockStores.find((s) => s.slug === slug);
}

/** The store whose console is shown in this scaffold. */
export const currentStore: Store = mockStores[0]!;
