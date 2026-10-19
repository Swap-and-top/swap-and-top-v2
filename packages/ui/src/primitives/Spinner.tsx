/**
 * Spinner — the loading circle carried over from the first Swap & Top app:
 * three quarters of a ring with rounded ends, turning once a second, in the
 * colour of whatever it sits in.
 */

import styles from './Spinner.module.css';

export function Spinner({
  size = 20,
  label = 'Loading',
  className,
}: {
  size?: number;
  /** Said to screen readers; leave empty where the button already says. */
  label?: string;
  className?: string;
}) {
  return (
    <svg
      className={[styles.spinner, className ?? ''].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 48.91 48.5"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <path d="M24.46,48.5C10.97,48.5,0,37.53,0,24.05,0,12.5,8.2,2.42,19.5,.09c2.43-.5,4.81,1.06,5.32,3.5,.5,2.43-1.06,4.81-3.5,5.32-7.14,1.47-12.31,7.84-12.31,15.14,0,8.52,6.93,15.46,15.46,15.46s15.46-6.93,15.46-15.46c0-2.49,2.01-4.5,4.5-4.5s4.5,2.01,4.5,4.5c0,13.49-10.97,24.46-24.46,24.46Z" />
    </svg>
  );
}
