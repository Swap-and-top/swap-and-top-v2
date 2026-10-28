/**
 * Users, roles and trust.
 *
 * Note what is absent: there is no occupation, student status or institution.
 * Trust is behavioural — see `confirmedDeals` — never a status marker.
 * docs/product/trust-and-safety.md explains why that changed.
 */

/**
 * What kind of account. Higher includes everything below; never compared
 * with equality. Only two are stored, user and super admin: our own staff
 * are users placed in departments (`StaffMembership`), never a role
 * (decisions P39, P40; docs/product/staff-console.md).
 */
export type Role = 'guest' | 'user' | 'super_admin';

/** The company's departments: each decides which Staff console sections
    its people see. */
export type Department =
  | 'trust_safety'
  | 'sales'
  | 'finance'
  | 'marketing'
  | 'devops'
  | 'executives'
  | 'board';

/** How each department reads, in the order the Team page lists them. */
export const DEPARTMENT_LABELS: Record<Department, string> = {
  trust_safety: 'Trust and safety',
  sales: 'Sales',
  finance: 'Finance',
  marketing: 'Marketing',
  devops: 'DevOps',
  executives: 'Executives',
  board: 'Board',
};

/** One department a person is in, as a member or its lead. */
export interface StaffMembership {
  department: Department;
  lead: boolean;
}

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
  /** Set when the user owns a store. Stores are a membership, not a role. */
  storeId?: string;
}

const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  user: 1,
  super_admin: 2,
};

/**
 * Role checks ask "at least this level", never "exactly this role".
 * v1 used equality and locked super admins out of every admin route.
 */
export function hasAtLeastRole(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export const ownsStore = (user: User): boolean => user.storeId !== undefined;
