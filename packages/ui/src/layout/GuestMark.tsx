/**
 * The mark for someone not signed in: an outlined person in an outlined
 * circle. White on the header's gradient (see AccountButton); large and in
 * the menu's blue above its welcome on a phone (see AppMenu). Coloured by
 * the text colour.
 */

export function GuestMark({
  size,
  strokeWidth = 1.5,
  className,
}: {
  size: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      className={['snt-icon', className ?? ''].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10.5" />
      <circle cx="12" cy="9.5" r="3.2" />
      <path d="M6.2 18.6c1.1-2.3 3.3-3.6 5.8-3.6s4.7 1.3 5.8 3.6" />
    </svg>
  );
}
