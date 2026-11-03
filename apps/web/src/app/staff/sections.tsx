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
  ListIcon,
  MessageIcon,
  PersonIcon,
  ReportIcon,
  StorefrontIcon,
  TrendIcon,
} from '@snt/ui/icons';

interface SectionDef extends StaffSection {
  /** The department it belongs to; none for Team, which is the super
      admin's and any lead's. */
  department?: Department;
  /** For everyone on the team, whatever their department: the Overview,
      which shows each their own sections. */
  everyone?: boolean;
  lead?: boolean;
  /** Also for the leaders of this department: Stores, whose Verify stores
      tab is Trust and safety leaders'. */
  leadersOf?: Department;
  built: boolean;
}

const SECTIONS: SectionDef[] = [
  // In the order Hillary set (2026-11-03); Revenue, which she did not
  // name, after Stores, and Growth and Health (Phase 7) after it.
  { href: '/staff/overview', label: 'Overview', shortLabel: 'Overview', icon: (s) => <ChartIcon size={s} />, everyone: true, built: true },
  { href: '/staff/reports', label: 'Reports', shortLabel: 'Reports', icon: (s) => <ReportIcon size={s} />, department: 'trust_safety', built: true },
  { href: '/staff/appeals', label: 'Appeals', shortLabel: 'Appeals', icon: (s) => <MessageIcon size={s} />, department: 'trust_safety', lead: true, built: true },
  { href: '/staff/users', label: 'Users', shortLabel: 'Users', icon: (s) => <PersonIcon size={s} />, department: 'trust_safety', built: true },
  { href: '/staff/team', label: 'Team members', shortLabel: 'Team', icon: (s) => <PersonIcon size={s} />, built: true },
  { href: '/staff/stores', label: 'Stores', shortLabel: 'Stores', icon: (s) => <StorefrontIcon size={s} />, department: 'sales', leadersOf: 'trust_safety', built: true },
  { href: '/staff/revenue', label: 'Revenue', shortLabel: 'Revenue', icon: (s) => <CashHandIcon size={s} filled={false} />, department: 'finance', built: true },
  { href: '/staff/activity', label: 'Activity log', shortLabel: 'Log', icon: (s) => <ListIcon size={s} />, department: 'trust_safety', built: true },
  { href: '/staff/growth', label: 'Growth', shortLabel: 'Growth', icon: (s) => <TrendIcon size={s} />, department: 'marketing', built: true },
  { href: '/staff/health', label: 'Health', shortLabel: 'Health', icon: (s) => <DesktopIcon size={s} />, department: 'devops', built: true },
];

function allowed(section: SectionDef, superAdmin: boolean, staff: StaffMembership[]): boolean {
  if (!section.built) return false;
  if (superAdmin) return true;
  if (section.everyone) return staff.length > 0;
  if (section.leadersOf && staff.some((row) => row.department === section.leadersOf && row.lead)) return true;
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
  sales: ['staff', 'sales'] as const,
  revenue: ['staff', 'revenue'] as const,
  overview: ['staff', 'overview'] as const,
  growth: ['staff', 'growth'] as const,
  health: ['staff', 'health'] as const,
  team: ['staff', 'team'] as const,
  users: (q: string) => ['staff', 'users', q] as const,
  user: (id: string) => ['staff', 'user', id] as const,
  activity: (filters: object) => ['staff', 'activity', filters] as const,
  teamFind: (q: string) => ['staff', 'team', 'find', q] as const,
};

/** The sections this person sees, in the console's order. */
/** Where the Staff console opens for this person: their first section,
    straight there (no stop at /staff), read without asking the API. */
export function useStaffHome(): string {
  const viewer = useSessionStore((state) => state.viewer);
  if (!viewer) return '/staff';
  const first = SECTIONS.find((section) => allowed(section, viewer.role === 'super_admin', viewer.staff ?? []));
  return first?.href ?? '/staff';
}

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
