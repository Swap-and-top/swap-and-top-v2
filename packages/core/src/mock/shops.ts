/** Mock shops. Names are placeholders. */

import type { Shop } from '../types/shop';

export const mockShops: Shop[] = [
  {
    id: 's-kopje',
    slug: 'kopje-computers',
    name: 'Kopje Computers',
    initials: 'KC',
    description: 'Laptops, desktops and parts. Trade-ins welcome.',
    location: 'Harare CBD',
    openingHours: 'Mon–Sat, 8am–5pm',
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
    openingHours: 'Mon–Sat, 8:30am–6pm',
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
    openingHours: 'Mon–Fri, 8am–5pm; Sat, 9am–1pm',
    verified: true,
    stockCount: 64,
    confirmedDeals: 12,
    replyHours: 2,
    joinedAt: '2025-06-02',
  },
  {
    /** Not yet verified — the shop row shows no badge, only the name. */
    id: 's-avondale-games',
    slug: 'avondale-games',
    name: 'Avondale Games',
    initials: 'AG',
    description: 'Consoles, controllers and games. Trade-ins accepted.',
    location: 'Avondale',
    openingHours: 'Mon–Sat, 9am–5pm',
    verified: false,
    stockCount: 15,
    confirmedDeals: 4,
    replyHours: 3,
    joinedAt: '2026-05-14',
  },
];

export function getShop(id: string | undefined): Shop | undefined {
  if (!id) return undefined;
  return mockShops.find((s) => s.id === id);
}

export function getShopBySlug(slug: string): Shop | undefined {
  return mockShops.find((s) => s.slug === slug);
}

/** The shop whose console is shown in this scaffold. */
export const currentShop: Shop = mockShops[0]!;
