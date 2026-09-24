'use client';

/**
 * ConsoleShell — the dealer console's responsive frame.
 *
 * One component renders both wireframe artboards: the phone layout with a dark
 * header and bottom nav, and the desktop layout with a sidebar. Which one you
 * see is decided by a `min-width` query, not by a different route.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Shop } from '@snt/core';
import {
  BoxIcon,
  ChartIcon,
  ChevronLeftIcon,
  ShopIcon,
  StarIcon,
} from '../icons';
import { CountBadge } from '../primitives/Badge';
import { ShopMark } from '../primitives/Placeholder';
import { ScreenTitle } from '../primitives/Text';
import styles from './ConsoleShell.module.css';

interface ConsoleNavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: (active: boolean) => ReactNode;
  /** Unread count, e.g. new leads. */
  count?: number;
}

export function ConsoleShell({
  shop,
  title,
  meta,
  actions,
  newLeadCount = 0,
  stockCount,
  children,
}: {
  shop: Shop;
  /** Section title, e.g. "Stock". */
  title: string;
  /** Secondary line under the title, e.g. "42 live · 3 sold this week". */
  meta?: string;
  /** Toolbar actions. Shown beside the title where there is room. */
  actions?: ReactNode;
  newLeadCount?: number;
  stockCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const items: ConsoleNavItem[] = [
    {
      href: '/console/stock',
      label: 'Stock',
      shortLabel: 'Stock',
      icon: (active) => <BoxIcon size={20} weight={active ? 1.9 : 1.7} />,
      count: stockCount,
    },
    {
      href: '/console/leads',
      label: 'Leads',
      shortLabel: 'Leads',
      icon: (active) => <ChartIcon size={20} weight={active ? 1.9 : 1.7} />,
      count: newLeadCount,
    },
    {
      href: '/console/promote',
      label: 'Promote',
      shortLabel: 'Promote',
      icon: (active) => <StarIcon size={20} weight={active ? 2.1 : 1.9} />,
    },
    {
      href: `/shop/${shop.slug}`,
      label: 'Shop profile',
      shortLabel: 'Shop',
      icon: (active) => <ShopIcon size={20} weight={active ? 1.9 : 1.7} />,
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={styles.shell}>
      {/* Sidebar — from the lg breakpoint up. */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <ShopMark initials={shop.initials} size={34} />
          <span>
            <span className={styles.shopName}>{shop.name}</span>
            <span className={styles.shopKicker}>Dealer console</span>
          </span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Console">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  styles.sidebarItem,
                  active ? styles.sidebarItemActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.icon(active)}
                <span className={styles.sidebarLabel}>{item.label}</span>
                {item.label === 'Leads' && item.count ? (
                  <CountBadge count={item.count} />
                ) : item.count ? (
                  <span className={styles.sidebarCount}>{item.count}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/" className={styles.sidebarBack}>
            <ChevronLeftIcon size={16} />
            Back to marketplace
          </Link>
        </div>
      </aside>

      {/* Dark header — phone only. */}
      <header className={styles.header}>
        <ShopMark initials={shop.initials} size={31} />
        <span className={styles.headerBody}>
          <span className={styles.shopName}>{shop.name}</span>
          <span className={styles.shopKicker}>Dealer console</span>
        </span>
        <Link href={`/shop/${shop.slug}`} className={styles.headerLink}>
          View shop
        </Link>
      </header>

      <div className={styles.main}>
        <div className={styles.titleBand}>
          <div className={styles.titleRow}>
            <ScreenTitle>{title}</ScreenTitle>
            {meta ? <span className={styles.titleMeta}>{meta}</span> : null}
          </div>
          {actions}
        </div>

        <div className={styles.content}>{children}</div>
      </div>

      {/* Bottom nav — phone only. */}
      <nav className={styles.bottomNav} aria-label="Console">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[styles.navItem, active ? styles.navItemActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {item.icon(active)}
              <span>{item.shortLabel}</span>
              {item.label === 'Leads' && item.count ? (
                <span className={styles.navBadge}>
                  <CountBadge count={item.count} />
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
