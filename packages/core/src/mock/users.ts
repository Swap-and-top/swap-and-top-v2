/**
 * Mock users.
 *
 * Names, numbers and places are placeholders. Note there is no occupation or
 * institution on any of them — trust is `confirmedDeals`, `replyHours`,
 * `joinedAt` and a clean report record.
 */

import type { User } from '../types/user';

export const CURRENT_USER_ID = 'u-tarisai';

export const mockUsers: User[] = [
  {
    id: 'u-tarisai',
    displayName: 'Tarisai M.',
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: 'Mt Pleasant',
    joinedAt: '2026-08-04',
    confirmedDeals: 3,
    replyHours: 2,
    hasUpheldReports: false,
  },
  {
    id: 'u-rudo',
    displayName: 'Rudo K.',
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: 'Avondale',
    joinedAt: '2026-06-19',
    confirmedDeals: 1,
    replyHours: 6,
    hasUpheldReports: false,
  },
  {
    id: 'u-blessing',
    displayName: 'Blessing T.',
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: 'Belvedere',
    joinedAt: '2026-09-02',
    /** No confirmed deals yet. The UI shows nothing rather than a zero. */
    confirmedDeals: 0,
    hasUpheldReports: false,
  },
  {
    id: 'u-kopje',
    displayName: 'Kopje Computers',
    phoneVerified: true,
    role: 'dealer',
    standing: 'good',
    location: 'Harare CBD',
    joinedAt: '2024-03-11',
    confirmedDeals: 31,
    replyHours: 1,
    hasUpheldReports: false,
    shopId: 's-kopje',
  },
];

export function getUser(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export const currentUser: User =
  mockUsers.find((u) => u.id === CURRENT_USER_ID) ?? mockUsers[0]!;
