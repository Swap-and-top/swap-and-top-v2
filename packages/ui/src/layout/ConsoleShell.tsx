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
import {
  getShopListings,
  useConsoleStore,
  useOfferStore,
  type Shop,
} from '@snt/core';
import {
  BoxIcon,
  ChartIcon,
  ChevronLeftIcon,
  SidebarIcon,
  ShopIcon,
  MegaphoneIcon,
  SwapIcon,
} from '../icons';
import { CountBadge } from '../primitives/Badge';
import { ShopMark } from '../primitives/Placeholder';
import { Bone } from '../primitives/Skeleton';
import { ScreenTitle } from '../primitives/Text';
import styles from './ConsoleShell.module.css';

interface ConsoleNavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: (active: boolean) => ReactNode;
  /** The same icon, larger, beside the page's title. */
  titleIcon: ReactNode;
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
  /** Section title, e.g. "Stock". Empty while the page loads. */
  title: string;
  /** Secondary line under the title, e.g. "42 live · 3 sold this week". */
  meta?: ReactNode;
  /** Toolbar actions. Shown beside the title where there is room. */
  actions?: ReactNode;
  newLeadCount?: number;
  stockCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const collapsed = useConsoleStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useConsoleStore((state) => state.toggleSidebar);
  // Trade-in offers on the shop's stock still waiting for a reply.
  const offers = useOfferStore((store) => store.offers);
  const stockIds = new Set(
    getShopListings(shop.id).map((listing) => listing.id),
  );
  const tradeInCount = offers.filter(
    (offer) => stockIds.has(offer.listingId) && offer.state === 'pending',
  ).length;

  const items: ConsoleNavItem[] = [
    {
      href: '/console/stock',
      label: 'Stock',
      shortLabel: 'Stock',
      icon: (active) => <BoxIcon size={20} weight={active ? 1.9 : 1.7} />,
      titleIcon: <BoxIcon size={24} />,
      count: stockCount,
    },
    {
      href: '/console/leads',
      label: 'Leads',
      shortLabel: 'Leads',
      icon: (active) => <ChartIcon size={20} weight={active ? 1.9 : 1.7} />,
      titleIcon: <ChartIcon size={24} />,
      count: newLeadCount,
    },
    {
      // Trade-ins offered towards stock that takes swaps: offers to accept
      // or decline, as the people asking see them on the listing.
      href: '/console/trade-ins',
      label: 'Swap offers',
      shortLabel: 'Swaps',
      icon: (active) => <SwapIcon size={20} weight={active ? 2.1 : 1.9} />,
      titleIcon: <SwapIcon size={24} />,
      count: tradeInCount,
    },
    {
      href: '/console/promote',
      label: 'Promote',
      shortLabel: 'Promote',
      icon: (active) => <MegaphoneIcon size={20} weight={active ? 2.1 : 1.9} />,
      titleIcon: <MegaphoneIcon size={24} />,
    },
    {
      // The shop as buyers see it, inside the console; the public page is a
      // button away from there.
      href: '/console/shop',
      label: 'Shop profile',
      shortLabel: 'Shop',
      icon: (active) => <ShopIcon size={20} weight={active ? 1.9 : 1.7} />,
      titleIcon: <ShopIcon size={24} />,
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  /** The section this page is in: its icon heads the page. */
  const section = items.find((item) => isActive(item.href));

  return (
    <div className={styles.shell}>
      {/* Sidebar — from the lg breakpoint up. */}
      {/* Folds to its icons with the button at its head, and opens again
          with the same button: a narrow strip of the shop's mark, the
          icons, and the way back. */}
      <aside
        className={[styles.sidebar, collapsed ? styles.collapsed : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.sidebarHead}>
          {/* The mark and the fold button on one line, the shop's name
              under them with room to breathe. */}
          <div className={styles.sidebarTop}>
            <ShopMark initials={shop.initials} size={34} />
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
          <span className={styles.sidebarShop}>
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
                // Folded, the label is hidden: the icon says it on hover.
                title={collapsed ? item.label : undefined}
                className={[
                  styles.sidebarItem,
                  active ? styles.sidebarItemActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* The icon on its tile, as icons sit across the app. */}
                <span className={styles.sidebarIcon}>{item.icon(active)}</span>
                <span className={styles.sidebarLabel}>{item.label}</span>
                {(item.label === 'Leads' || item.label === 'Swap offers') &&
                item.count ? (
                  <CountBadge count={item.count} />
                ) : item.count ? (
                  <span className={styles.sidebarCount}>{item.count}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link
            href="/"
            className={styles.sidebarBack}
            title={collapsed ? 'Back to marketplace' : undefined}
          >
            <ChevronLeftIcon size={16} />
            <span className={styles.sidebarLabel}>Back to marketplace</span>
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
            {/* The section's icon, larger, on its pale tile. */}
            {section ? (
              <span className={styles.titleIcon} aria-hidden>
                {section.titleIcon}
              </span>
            ) : null}
            {/* The title, and what the page is for under it. */}
            <div className={styles.titleText}>
              {/* No title yet: the page is loading, and a bar stands in. */}
              {title ? (
                <ScreenTitle>{title}</ScreenTitle>
              ) : (
                <Bone width={120} height={22} />
              )}
              {meta ? <span className={styles.titleMeta}>{meta}</span> : null}
            </div>
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
              {/* As on the marketplace's bar: the icon in a pill, filled
                  with the blue where it is the page on show, and the
                  label under it. A waiting count sits on the pill. */}
              <span className={styles.navPill}>
                {item.icon(false)}
                {(item.label === 'Leads' || item.label === 'Swap offers') &&
                item.count ? (
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
