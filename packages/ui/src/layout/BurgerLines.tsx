/**
 * The three lines of the phone's menu button, which turn into a cross while
 * the menu is open: the top and bottom lines swing in to cross, the middle
 * one fades. The header's button draws them; the open menu draws the same
 * lines in the same place and crosses them (see AppMenu), so it reads as the
 * one button changing. Coloured by the text colour.
 */

import styles from './BurgerLines.module.css';

export function BurgerLines({ cross = false }: { cross?: boolean }) {
  return (
    <span className={[styles.lines, cross ? styles.cross : ''].filter(Boolean).join(' ')} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}
