'use client';

/**
 * Every section of the Staff console (docs/product/staff-console.md,
 * section 2): which department it belongs to, whether it needs that
 * department's lead, and whether it is built yet. A person sees the built
 * sections of the departments they are in; the super admin sees them all.
 * Sections not built yet stay hidden rather than showing an empty page.
 * Reports and Appeals show how many are waiting (GET /api/staff/counts),
 * through TanStack Query: every minute, and after each claim or decision.
 */

import { useQuery } from '@tanstack/react-query';
import { useSessionStore, type Department, type StaffMembership } from '@snt/core';
import type { StaffSection } from '@snt/ui';
import { apiGet } from '@/lib/query';
import {
  CashHandIcon,
  ChartIcon,
  DesktopIcon,
  GridIcon,
  ListIcon,
  MessageIcon,
  PersonIcon,
  ReportIcon,
  ShieldCheckIcon,
  StorefrontIcon,
  TrendIcon,
} from '@snt/ui/icons';

interface SectionDef extends StaffSection {
  /** The department it belongs to; none for Team, which is the super
      admin's and any lead's. */
  department?: Department;
  lead?: boolean;
  built: boolean;
}

const SECTIONS: SectionDef[] = [
  // Trust and safety
  { href: '/staff/reports', label: 'Reports', shortLabel: 'Reports', icon: (s) => <ReportIcon size={s} />, department: 'trust_safety', built: true },
  { href: '/staff/users', label: 'Users', shortLabel: 'Users', icon: (s) => <PersonIcon size={s} />, department: 'trust_safety', built: true },
  { href: '/staff/appeals', label: 'Appeals', shortLabel: 'Appeals', icon: (s) => <MessageIcon size={s} />, department: 'trust_safety', lead: true, built: true },
  { href: '/staff/verify', label: 'Verify stores', shortLabel: 'Verify', icon: (s) => <ShieldCheckIcon size={s} />, department: 'trust_safety', lead: true, built: true },
  { href: '/staff/activity', label: 'Activity log', shortLabel: 'Log', icon: (s) => <ListIcon size={s} />, department: 'trust_safety', built: true },
  // The business side (Phase 6) and Marketing and DevOps (Phase 7)
  { href: '/staff/overview', label: 'Overview', shortLabel: 'Overview', icon: (s) => <ChartIcon size={s} />, department: 'executives', built: false },
  { href: '/staff/board', label: 'Board summary', shortLabel: 'Board', icon: (s) => <GridIcon size={s} />, department: 'board', built: false },
  { href: '/staff/money', label: 'Money', shortLabel: 'Money', icon: (s) => <CashHandIcon size={s} filled={false} />, department: 'finance', built: false },
  { href: '/staff/sales', label: 'Stores to call', shortLabel: 'Sales', icon: (s) => <StorefrontIcon size={s} />, department: 'sales', built: false },
  { href: '/staff/growth', label: 'Growth', shortLabel: 'Growth', icon: (s) => <TrendIcon size={s} />, department: 'marketing', built: false },
  { href: '/staff/health', label: 'Health', shortLabel: 'Health', icon: (s) => <DesktopIcon size={s} />, department: 'devops', built: false },
  // The team: the super admin, and leads for their own department
  { href: '/staff/team', label: 'Team', shortLabel: 'Team', icon: (s) => <PersonIcon size={s} />, built: true },
];

function allowed(section: SectionDef, superAdmin: boolean, staff: StaffMembership[]): boolean {
  if (!section.built) return false;
  if (superAdmin) return true;
  if (!section.department) return staff.some((row) => row.lead);
  return staff.some((row) => row.department === section.department && (!section.lead || row.lead));
}

/** The Staff console's queries, so a change can refresh what it touched. */
export const staffKeys = {
  all: ['staff'] as const,
  counts: ['staff', 'counts'] as const,
  reports: ['staff', 'reports'] as const,
  appeals: ['staff', 'appeals'] as const,
  verify: ['staff', 'verify'] as const,
  team: ['staff', 'team'] as const,
  users: (q: string) => ['staff', 'users', q] as const,
  user: (id: string) => ['staff', 'user', id] as const,
  activity: (filters: object) => ['staff', 'activity', filters] as const,
  teamFind: (q: string) => ['staff', 'team', 'find', q] as const,
};

/** The sections this person sees, in the console's order. */
export function useStaffSections(): StaffSection[] {
  const viewer = useSessionStore((state) => state.viewer);
  const trustSafety = viewer
    ? viewer.role === 'super_admin' || (viewer.staff ?? []).some((row) => row.department === 'trust_safety')
    : false;
  // Kept fresh by itself every minute, and after each claim or decision
  // (which refresh `staffKeys.counts`).
  const { data: counts } = useQuery({
    queryKey: staffKeys.counts,
    queryFn: () => apiGet<{ reports: number; appeals: number }>('/staff/counts'),
    enabled: trustSafety,
    refetchInterval: 60_000,
  });
  if (!viewer) return [];
  const superAdmin = viewer.role === 'super_admin';
  const countOf: Record<string, number | undefined> = {
    '/staff/reports': counts?.reports,
    '/staff/appeals': counts?.appeals,
  };
  return SECTIONS.filter((section) => allowed(section, superAdmin, viewer.staff ?? [])).map(
    ({ href, label, shortLabel, icon }) => ({ href, label, shortLabel, icon, count: countOf[href] }),
  );
}
