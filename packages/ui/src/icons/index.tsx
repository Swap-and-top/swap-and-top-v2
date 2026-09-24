/**
 * Icons.
 *
 * Inline stroke SVG, one component each, all in this file so the set is easy to
 * scan and extend. No icon library: these are the exact paths from the
 * wireframes, and inline SVG takes its colour from `currentColor` so a parent's
 * CSS controls it.
 *
 * Conventions:
 *  - 24×24 viewBox, rendered at `size` (default 20)
 *  - stroke only, never fill, unless `filled` is offered
 *  - decorative by default (`aria-hidden`); pass `title` to make one meaningful
 *
 * If an icon needs a label, prefer `aria-label` on the surrounding button.
 */

import type { SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Rendered width and height in px. */
  size?: number;
  /** Stroke width. Bump it for small sizes or emphasis. */
  weight?: number;
  /** Accessible name. Omit for decorative icons. */
  title?: string;
}

function Svg({
  size = 20,
  weight = 1.7,
  title,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* --------------------------------------------------------- navigation --- */

/** Browse. Four squares. */
export const GridIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);

/** Wanted. A megaphone — demand being announced. */
export const MegaphoneIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 10.5l13-5.5v13l-13-5.5z" />
    <path d="M7 12.5V18a2 2 0 0 0 4 0v-4" />
  </Svg>
);

export const BookmarkIcon = ({ filled = false, ...props }: IconProps & { filled?: boolean }) => (
  <Svg {...props} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />
  </Svg>
);

export const PersonIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
  </Svg>
);

export const PlusIcon = (props: IconProps) => (
  <Svg weight={2.2} {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Svg weight={1.9} {...props}>
    <path d="M14.5 5.5l-7 6.5 7 6.5" />
  </Svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Svg weight={1.9} {...props}>
    <path d="M9.5 5.5l7 6.5-7 6.5" />
  </Svg>
);

export const CloseIcon = (props: IconProps) => (
  <Svg weight={1.9} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

/* -------------------------------------------------------------- actions --- */

export const SearchIcon = (props: IconProps) => (
  <Svg weight={1.9} {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

export const FilterIcon = (props: IconProps) => (
  <Svg weight={1.8} {...props}>
    <path d="M4 6.5h16M7 12h10M10 17.5h4" />
  </Svg>
);

/** The swap mechanic. Two opposing arrows — the signature mark. */
export const SwapIcon = (props: IconProps) => (
  <Svg weight={2.1} {...props}>
    <path d="M3 9h13M13 6l3 3-3 3" />
    <path d="M21 15H8M11 18l-3-3 3-3" />
  </Svg>
);

export const CheckIcon = (props: IconProps) => (
  <Svg weight={2.6} {...props}>
    <path d="M4 12l5 5L20 6" />
  </Svg>
);

export const PhoneIcon = (props: IconProps) => (
  <Svg weight={1.8} {...props}>
    <path d="M5.5 4.5h4l2 5-2.5 1.5a11 11 0 0 0 4 4L14.5 12.5l5 2v4a1.5 1.5 0 0 1-1.7 1.5C10.5 19 5 13.5 4 6.2A1.5 1.5 0 0 1 5.5 4.5z" />
  </Svg>
);

export const MessageIcon = (props: IconProps) => (
  <Svg weight={1.8} {...props}>
    <path d="M4 18.5V7a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 7v6.5a2.5 2.5 0 0 1-2.5 2.5H8z" />
  </Svg>
);

export const ShareIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8.5 13.5l7-4M8.5 10.5l7 4" />
    <circle cx="18" cy="6.5" r="2.6" />
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="17.5" r="2.6" />
  </Svg>
);

/* ---------------------------------------------------------------- misc --- */

export const BellIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
);

/** Stock. An open box. */
export const BoxIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 8l8.5-4 8.5 4v8l-8.5 4-8.5-4z" />
    <path d="M3.5 8l8.5 4 8.5-4M12 12v8" />
  </Svg>
);

export const ChartIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 20h17M7 20v-6M12 20V7M17 20v-9" />
  </Svg>
);

export const ShopIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 9.5h16v10.5H4z" />
    <path d="M4 9.5L6 4h12l2 5.5" />
  </Svg>
);

export const StarIcon = (props: IconProps) => (
  <Svg weight={1.9} {...props}>
    <path d="M12 4l2.3 4.9 5.2.7-3.8 3.6 1 5.3-4.7-2.6-4.7 2.6 1-5.3-3.8-3.6 5.2-.7z" />
  </Svg>
);

export const ClockIcon = (props: IconProps) => (
  <Svg weight={1.8} {...props}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 10v3.5l2.5 1.5M9 3h6" />
  </Svg>
);

export const InfoIcon = (props: IconProps) => (
  <Svg weight={1.8} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 16v-3.5M12 8.5h.01" />
  </Svg>
);

export const ShieldIcon = (props: IconProps) => (
  <Svg weight={1.8} {...props}>
    <path d="M12 3.5l7 3v5.5c0 4-3 7-7 8.5-4-1.5-7-4.5-7-8.5V6.5z" />
  </Svg>
);

export const ShieldCheckIcon = (props: IconProps) => (
  <Svg weight={1.8} {...props}>
    <path d="M12 3.5l7 3v5.5c0 4-3 7-7 8.5-4-1.5-7-4.5-7-8.5V6.5z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </Svg>
);

export const SettingsIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
  </Svg>
);

export const ListIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </Svg>
);

/** Image placeholder. Drawn inside a grey box where a photo will go. */
export const ImageIcon = (props: IconProps) => (
  <Svg weight={1.6} strokeLinecap="butt" {...props}>
    <path d="M3.5 6h17v12h-17z" />
    <circle cx="9" cy="11" r="1.8" />
    <path d="M3.5 17l5.5-4.5 3.5 2.8 3-2 5 4" />
  </Svg>
);

/** Reduced version for small placeholder boxes. */
export const ImageSmallIcon = (props: IconProps) => (
  <Svg weight={1.6} strokeLinecap="butt" {...props}>
    <path d="M3.5 6h17v12h-17z" />
    <circle cx="9" cy="11" r="1.8" />
  </Svg>
);
