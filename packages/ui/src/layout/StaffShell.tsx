'use client';

/**
 * StaffShell — the Staff console's frame (docs/product/staff-console.md),
 * built as the Store console's is and sharing its look: a sidebar from a
 * laptop up, a dark header and a bar of sections at the foot on a phone.
 * Which sections show is the web app's to say, from the person's
 * departments; this only lays them out. With more sections than fit on a
 * phone, the bar at the foot scrolls sideways.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useConsoleStore } from '@snt/core';
import { ChevronLeftIcon, SidebarIcon } from '../icons';
import { CountBadge } from '../primitives/Badge';
import { StoreMark } from '../primitives/Placeholder';
import { Bone } from '../primitives/Skeleton';
import { ScreenTitle } from '../primitives/Text';
import styles from './ConsoleShell.module.css';
import staffStyles from './StaffShell.module.css';

export interface StaffSection {
  href: string;
  label: string;
  /** For the bar at the foot of a phone. */
  shortLabel: string;
  icon: (size: number) => ReactNode;
  /** Waiting work, such as open reports. */
  count?: number;
}

export function StaffShell({
  sections,
  name,
  initials,
  title,
  meta,
  actions,
  loading = false,
  children,
}: {
  sections: StaffSection[];
  /** Who they are is not known yet: skeletons for their name and sections. */
  loading?: boolean;
  /** Who is signed in, at the head of the sidebar. */
  name: string;
  initials: string;
  /** The section's title. Empty while the page loads. */
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const collapsed = useConsoleStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useConsoleStore((state) => state.toggleSidebar);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const section = sections.find((item) => isActive(item.href));

  return (
    <div className={styles.shell}>
      <aside className={[styles.sidebar, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
        <div className={styles.sidebarHead}>
          <div className={styles.sidebarTop}>
            <StoreMark initials={initials} size={34} />
            <button
              type="button"
              className={styles.fold}
              aria-label={collapsed ? 'Open the sidebar' : 'Fold the sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Open the sidebar' : 'Fold the sidebar'}
              onClick={toggleSidebar}
            >
              <SidebarIcon size={20} open={!collapsed} />
            </button>
          </div>
          <span className={styles.sidebarStore}>
            <span className={styles.storeName}>{loading ? <Bone width={90} height={14} /> : name}</span>
            <span className={styles.storeKicker}>Staff console</span>
          </span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Staff console">
          {loading
            ? Array.from({ length: 3 }, (_, n) => (
                <span key={n} className={styles.sidebarItem} aria-hidden>
                  <Bone width={20} height={20} shape="circle" />
                  <span className={styles.sidebarLabel}>
                    <Bone width={80} height={12} />
                  </span>
                </span>
              ))
            : null}
          {sections.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={[styles.sidebarItem, active ? styles.sidebarItemActive : ''].filter(Boolean).join(' ')}
              >
                <span className={styles.sidebarIcon}>{item.icon(20)}</span>
                <span className={styles.sidebarLabel}>{item.label}</span>
                {item.count ? <CountBadge count={item.count} /> : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/" className={styles.sidebarBack} title={collapsed ? 'Back to marketplace' : undefined}>
            <ChevronLeftIcon size={16} />
            <span className={styles.sidebarLabel}>Back to marketplace</span>
          </Link>
        </div>
      </aside>

      <header className={styles.header}>
        <span className={styles.headerMark}>
          <StoreMark initials={initials} size={36} />
        </span>
        <span className={styles.headerBody}>
          <span className={styles.storeName}>{loading ? <Bone width={90} height={14} /> : name}</span>
          <span className={styles.storeKicker}>Staff console</span>
        </span>
        <Link href="/" className={styles.headerLink}>
          Back to marketplace
        </Link>
      </header>

      <div className={styles.main}>
        <div className={styles.titleBand}>
          <div className={styles.titleRow}>
            {section ? (
              <span className={styles.titleIcon} aria-hidden>
                {section.icon(24)}
              </span>
            ) : loading ? (
              // Its place kept, so the title does not move when it comes.
              <span className={styles.titleIcon} aria-hidden />
            ) : null}
            <div className={styles.titleText}>
              {title ? <ScreenTitle>{title}</ScreenTitle> : <Bone width={120} height={22} />}
              {meta ? <span className={styles.titleMeta}>{meta}</span> : null}
            </div>
          </div>
          {actions}
        </div>
        <div className={styles.content}>{children}</div>
      </div>

      <nav
        className={[styles.bottomNav, sections.length > 5 ? staffStyles.scrolls : ''].filter(Boolean).join(' ')}
        aria-label="Staff console"
        data-bottom-bar
      >
        {loading
          ? Array.from({ length: 3 }, (_, n) => (
              <span key={n} className={styles.navItem} aria-hidden>
                <span className={styles.navPill}>
                  <Bone width={20} height={20} shape="circle" />
                </span>
                <Bone width={40} height={10} />
              </span>
            ))
          : null}
        {sections.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[styles.navItem, active ? styles.navItemActive : ''].filter(Boolean).join(' ')}
            >
              <span className={styles.navPill}>
                {item.icon(20)}
                {item.count ? (
                  <span className={styles.navBadge}>
                    <CountBadge count={item.count} />
                  </span>
                ) : null}
              </span>
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
