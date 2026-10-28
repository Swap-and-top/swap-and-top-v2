'use client';

/**
 * Every section of the Staff console (docs/product/staff-console.md,
 * section 2): which department it belongs to, whether it needs that
 * department's lead, and whether it is built yet. A person sees the built
 * sections of the departments they are in; the super admin sees them all.
 * Sections not built yet stay hidden rather than showing an empty page.
 */

import { useSessionStore, type Department, type StaffMembership } from '@snt/core';
import type { StaffSection } from '@snt/ui';
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
  { href: '/staff/reports', label: 'Reports', shortLabel: 'Reports', icon: (s) => <ReportIcon size={s} />, department: 'trust_safety', built: false },
  { href: '/staff/people', label: 'People', shortLabel: 'People', icon: (s) => <PersonIcon size={s} />, department: 'trust_safety', built: false },
  { href: '/staff/appeals', label: 'Appeals', shortLabel: 'Appeals', icon: (s) => <MessageIcon size={s} />, department: 'trust_safety', lead: true, built: false },
  { href: '/staff/verify', label: 'Verify stores', shortLabel: 'Verify', icon: (s) => <ShieldCheckIcon size={s} />, department: 'trust_safety', lead: true, built: true },
  { href: '/staff/activity', label: 'Activity log', shortLabel: 'Log', icon: (s) => <ListIcon size={s} />, department: 'trust_safety', built: false },
  // The business side (Phase 6) and Marketing and DevOps (Phase 7)
  { href: '/staff/overview', label: 'Overview', shortLabel: 'Overview', icon: (s) => <ChartIcon size={s} />, department: 'executives', built: false },
  { href: '/staff/board', label: 'Board summary', shortLabel: 'Board', icon: (s) => <GridIcon size={s} />, department: 'board', built: false },
  { href: '/staff/money', label: 'Money', shortLabel: 'Money', icon: (s) => <CashHandIcon size={s} filled={false} />, department: 'finance', built: false },
  { href: '/staff/sales', label: 'Stores to call', shortLabel: 'Sales', icon: (s) => <StorefrontIcon size={s} />, department: 'sales', built: false },
  { href: '/staff/growth', label: 'Growth', shortLabel: 'Growth', icon: (s) => <TrendIcon size={s} />, department: 'marketing', built: false },
  { href: '/staff/health', label: 'Health', shortLabel: 'Health', icon: (s) => <DesktopIcon size={s} />, department: 'devops', built: false },
  // The team: the super admin, and leads for their own department
  { href: '/staff/team', label: 'Team', shortLabel: 'Team', icon: (s) => <PersonIcon size={s} />, built: false },
];

function allowed(section: SectionDef, superAdmin: boolean, staff: StaffMembership[]): boolean {
  if (!section.built) return false;
  if (superAdmin) return true;
  if (!section.department) return staff.some((row) => row.lead);
  return staff.some((row) => row.department === section.department && (!section.lead || row.lead));
}

/** The sections this person sees, in the console's order. */
export function useStaffSections(): StaffSection[] {
  const viewer = useSessionStore((state) => state.viewer);
  if (!viewer) return [];
  const superAdmin = viewer.role === 'super_admin';
  return SECTIONS.filter((section) => allowed(section, superAdmin, viewer.staff ?? [])).map(
    ({ href, label, shortLabel, icon, count }) => ({ href, label, shortLabel, icon, count }),
  );
}
