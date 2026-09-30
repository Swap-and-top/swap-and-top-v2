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
  {
    id: 'u-tendai',
    displayName: 'Tendai C.',
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: 'Borrowdale',
    joinedAt: '2026-02-11',
    confirmedDeals: 5,
    replyHours: 1,
    hasUpheldReports: false,
  },
  {
    id: 'u-nyasha',
    displayName: 'Nyasha P.',
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: 'Greendale',
    joinedAt: '2026-07-28',
    confirmedDeals: 2,
    replyHours: 4,
    hasUpheldReports: false,
  },
  {
    id: 'u-farai',
    displayName: 'Farai D.',
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: 'Waterfalls',
    joinedAt: '2026-09-10',
    /** New, no confirmed deals yet. */
    confirmedDeals: 0,
    hasUpheldReports: false,
  },
  {
    id: 'u-chipo',
    displayName: 'Chipo N.',
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: 'Marlborough',
    joinedAt: '2025-11-03',
    confirmedDeals: 7,
    replyHours: 1,
    hasUpheldReports: false,
  },
  {
    id: 'u-samora',
    displayName: 'Samora Mobile',
    phoneVerified: true,
    role: 'dealer',
    standing: 'good',
    location: 'Harare CBD',
    joinedAt: '2025-01-20',
    confirmedDeals: 19,
    replyHours: 1,
    hasUpheldReports: false,
    shopId: 's-samora',
  },
  {
    id: 'u-msasa',
    displayName: 'Msasa PC Parts',
    phoneVerified: true,
    role: 'dealer',
    standing: 'good',
    location: 'Msasa',
    joinedAt: '2025-06-02',
    confirmedDeals: 12,
    replyHours: 2,
    hasUpheldReports: false,
    shopId: 's-msasa',
  },
  {
    id: 'u-avgames',
    displayName: 'Avondale Games',
    phoneVerified: true,
    role: 'dealer',
    standing: 'good',
    location: 'Avondale',
    joinedAt: '2026-05-14',
    confirmedDeals: 4,
    replyHours: 3,
    hasUpheldReports: false,
    shopId: 's-avondale-games',
  },
];

export function getUser(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export const currentUser: User =
  mockUsers.find((u) => u.id === CURRENT_USER_ID) ?? mockUsers[0]!;
