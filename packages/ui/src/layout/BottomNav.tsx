'use client';

/**
 * BottomNav — the marketplace's five-item navigation.
 *
 * The active item is derived from the pathname rather than passed in, so no
 * page has to remember to declare which tab it belongs to.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookmarkIcon,
  GridIcon,
  MegaphoneIcon,
  PersonIcon,
  PlusIcon,
} from '../icons';
import { CountBadge } from '../primitives/Badge';
import styles from './BottomNav.module.css';

interface NavItem {
  href: string;
  label: string;
  /** Extra path prefixes that should also light this item up. */
  alsoMatches?: string[];
}

const ITEMS: NavItem[] = [
  { href: '/', label: 'Browse', alsoMatches: ['/listing', '/shop', '/search'] },
  { href: '/wanted', label: 'Wanted' },
  { href: '/saved', label: 'Saved' },
  { href: '/me', label: 'Me', alsoMatches: ['/deals'] },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') {
    if (pathname === '/') return true;
    return (item.alsoMatches ?? []).some((prefix) =>
      pathname.startsWith(prefix),
    );
  }
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  return (item.alsoMatches ?? []).some((prefix) => pathname.startsWith(prefix));
}

function iconFor(label: string, active: boolean) {
  switch (label) {
    case 'Browse':
      return <GridIcon size={20} weight={active ? 1.9 : 1.7} />;
    case 'Wanted':
      return <MegaphoneIcon size={20} weight={active ? 1.9 : 1.7} />;
    case 'Saved':
      return <BookmarkIcon size={20} filled={active} />;
    default:
      return <PersonIcon size={20} weight={active ? 1.9 : 1.7} />;
  }
}

export function BottomNav({
  /** Deals awaiting this user's confirmation. Shown on the Me item. */
  pendingConfirmations = 0,
}: {
  pendingConfirmations?: number;
}) {
  const pathname = usePathname();

  // Browse, Wanted, [post], Saved, Me — the post action sits in the middle.
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <nav className={styles.nav} aria-label="Main">
      {left.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}

      <Link href="/post" aria-label="Post a listing" className={styles.post}>
        <span className={styles.postCircle}>
          <PlusIcon size={22} />
        </span>
      </Link>

      {right.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          badge={item.label === 'Me' ? pendingConfirmations : 0}
        />
      ))}
    </nav>
  );
}

function NavLink({
  item,
  pathname,
  badge = 0,
}: {
  item: NavItem;
  pathname: string;
  badge?: number;
}) {
  const active = isActive(pathname, item);

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={[styles.item, active ? styles.itemActive : '']
        .filter(Boolean)
        .join(' ')}
    >
      {iconFor(item.label, active)}
      <span>{item.label}</span>
      {badge > 0 ? (
        <span className={styles.badge}>
          <CountBadge count={badge} />
        </span>
      ) : null}
    </Link>
  );
}
