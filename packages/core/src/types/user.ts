/**
 * Users, roles and trust.
 *
 * Note what is absent: there is no occupation, student status or institution.
 * Trust is behavioural — see `confirmedDeals` — never a status marker.
 * docs/product/trust-and-safety.md explains why that changed.
 */

/** Higher roles include everything below them. Never compared with equality. */
export type Role =
  | 'guest'
  | 'user'
  | 'dealer'
  | 'moderator'
  | 'admin'
  | 'super_admin';

export type AccountStanding =
  | 'good'
  | 'warned'
  | 'limited'
  | 'suspended'
  | 'banned';

export interface User {
  id: string;
  /** First name and surname initial. Full names are never shown publicly. */
  displayName: string;
  /** The identity anchor. Verified by one-time code, required to post. */
  phoneVerified: boolean;
  role: Role;
  standing: AccountStanding;
  location: string;
  joinedAt: string;
  /** Deals both parties confirmed completed. The public trust signal. */
  confirmedDeals: number;
  /** Median hours from contact to response. Undefined when not enough data. */
  replyHours?: number;
  /** Whether any report against this account has been upheld. */
  hasUpheldReports: boolean;
  /** Set when the user is a dealer. */
  shopId?: string;
}

const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  user: 1,
  dealer: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

/**
 * Role checks ask "at least this level", never "exactly this role".
 * v1 used equality and locked super admins out of every admin route.
 */
export function hasAtLeastRole(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export const isDealer = (user: User): boolean => user.shopId !== undefined;
