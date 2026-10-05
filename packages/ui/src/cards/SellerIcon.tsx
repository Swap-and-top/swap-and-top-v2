/**
 * SellerIcon — the little mark before a seller's name that says who is
 * selling: a person, or a shop or dealer. The same on every card and row, so
 * the two can be told apart at a glance wherever a name appears.
 */

import { PersonIcon, StorefrontIcon } from '../icons';
import styles from './SellerIcon.module.css';

export function SellerIcon({ kind }: { kind: 'person' | 'shop' }) {
  const Icon = kind === 'shop' ? StorefrontIcon : PersonIcon;
  return (
    <Icon
      size={15}
      weight={1.9}
      title={kind === 'shop' ? 'Shop' : 'Person'}
      className={styles.icon}
    />
  );
}
