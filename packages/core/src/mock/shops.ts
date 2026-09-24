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
