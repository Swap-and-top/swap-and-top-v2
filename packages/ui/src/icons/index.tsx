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

/**
 * For the few glyphs carried over from the v1 app, which are filled shapes on
 * their own viewBox rather than 24×24 strokes. Rendered square at `size`,
 * with the artwork centred.
 */
function FilledSvg({
  size = 20,
  title,
  viewBox,
  children,
  ...rest
}: Omit<IconProps, 'weight'> & { viewBox: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
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
export const GridIcon = ({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) => (
  // Filled for the active tab: the same squares, solid.
  <Svg fill={filled ? 'currentColor' : 'none'} {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);

/**
 * Wanted. An open hand held out, palm up, ready to receive — someone asking
 * for a thing. The outline is after Lucide's hand-coins, without the coins
 * (ISC licence); the filled form closes the hand into one solid shape.
 */
export const ReceiveHandIcon = ({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) => (
  <Svg {...props}>
    {/* The artwork sits low in its box; lift it to the centre and scale it up
        to match the other nav icons, keeping the stroke its usual width. */}
    <g transform="translate(12 12) scale(1.15) translate(-12.2 -16.2)">
      {filled ? (
        <>
          <path
            fill="currentColor"
            vectorEffect="non-scaling-stroke"
            d="M3 17l5.6-5.4c.3-.4.8-.6 1.4-.6h3a2 2 0 1 1 0 4l1.45-.61 4.2-3.9a2 2 0 0 1 2.75 2.91l-4.6 4.4c-.7.8-1.7 1.2-2.8 1.2h-4c-.6 0-1.1.2-1.4.6L7 21z"
          />
          {/* Knocked out of the fill, so the thumb still reads as a thumb. */}
          <path
            d="M10.5 15h2.5"
            stroke="var(--snt-bg-surface)"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : (
        <>
          <path
            vectorEffect="non-scaling-stroke"
            d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"
          />
          <path
            vectorEffect="non-scaling-stroke"
            d="M7 21l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"
          />
        </>
      )}
      {/* The cuff at the wrist. */}
      <path vectorEffect="non-scaling-stroke" d="M2 16l6 6" />
    </g>
  </Svg>
);

/**
 * A person: head and shoulders. The shoulders close along the bottom, so the
 * outline is one joined shape and can be filled for the active tab.
 */
export const PersonIcon = ({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) => (
  <Svg fill={filled ? 'currentColor' : 'none'} {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 19.5c0-3.4 3.1-5.5 7-5.5s7 2.1 7 5.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5z" />
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

/**
 * Share. The v1 app's glyph — three joined dots, drawn as a filled shape —
 * carried over so the icon people already know stays the same.
 */
export const ShareIcon = ({ size = 20, title, ...rest }: IconProps) => (
  <FilledSvg size={size} title={title} viewBox="0 0 60.74 66.83" {...rest}>
    <path d="M50.63,47.28h0c-2.45,0-4.81.93-6.61,2.59l-24.02-13.95c.19-.77.29-1.56.31-2.36-.02-.79-.12-1.58-.3-2.35l23.74-13.81c4.05,3.79,10.42,3.61,14.24-.41,1.78-1.88,2.76-4.37,2.74-6.95,0-5.55-4.52-10.04-10.11-10.04s-10.11,4.5-10.11,10.04c.02.79.12,1.58.3,2.35l-23.75,13.81c-4.09-3.81-10.51-3.6-14.34.47-3.83,4.07-3.62,10.45.47,14.25,3.9,3.63,9.97,3.63,13.87,0l23.99,13.98c-.17.72-.27,1.45-.27,2.19.02,5.4,4.44,9.76,9.88,9.74s9.82-4.42,9.8-9.81c-.02-5.38-4.42-9.74-9.84-9.74ZM50.72,5.79c2.42,0,4.38,1.96,4.38,4.38s-1.96,4.38-4.38,4.38-4.38-1.96-4.38-4.38,1.96-4.38,4.38-4.38ZM10.1,37.93c-2.42,0-4.38-1.96-4.38-4.38s1.96-4.38,4.38-4.38,4.38,1.96,4.38,4.38-1.96,4.38-4.38,4.38ZM50.72,61.31c-2.42,0-4.38-1.96-4.38-4.38s1.96-4.38,4.38-4.38,4.38,1.96,4.38,4.38-1.96,4.38-4.38,4.38Z" />
  </FilledSvg>
);

/* ---------------------------------------------------------- categories --- */

/** Laptops. An open lid over a base. */
export const LaptopIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4.5" y="5" width="15" height="10" rx="1.5" />
    <path d="M2.5 18.5h19" />
  </Svg>
);

/** Phones. A handset seen from the front — not the call glyph. */
export const MobileIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 17.5h2" />
  </Svg>
);

/** Desktops. A monitor on a stand. */
export const DesktopIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="4" width="17" height="11.5" rx="1.5" />
    <path d="M9 20h6M12 15.5V20" />
  </Svg>
);

/** Consoles. A controller. */
export const ConsoleIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 7.5h10a4.5 4.5 0 0 1 4.3 5.8l-1 3.4a2.3 2.3 0 0 1-3.9.9L14.5 15.5h-5l-1.9 2.1a2.3 2.3 0 0 1-3.9-.9l-1-3.4A4.5 4.5 0 0 1 7 7.5z" />
    <path d="M8 10.5v3M6.5 12h3M15.5 11h.01M17.5 13h.01" />
  </Svg>
);

/** Parts. A chip with pins. */
export const PartIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
    <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
  </Svg>
);

/** Accessories. Headphones. */
export const AccessoryIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4.5 16v-3.5a7.5 7.5 0 0 1 15 0V16" />
    <rect x="3.5" y="14" width="4" height="6" rx="1.5" />
    <rect x="16.5" y="14" width="4" height="6" rx="1.5" />
  </Svg>
);

const CATEGORY_ICONS = {
  laptops: LaptopIcon,
  phones: MobileIcon,
  desktops: DesktopIcon,
  consoles: ConsoleIcon,
  parts: PartIcon,
  accessories: AccessoryIcon,
} as const;

/** The icon for a listing category. */
export const CategoryIcon = ({
  category,
  ...props
}: IconProps & { category: keyof typeof CATEGORY_ICONS }) => {
  const Icon = CATEGORY_ICONS[category];
  return <Icon {...props} />;
};

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

/**
 * Wanted, as a listing type: binoculars — someone on the lookout for a
 * thing. The outline is Lucide's binoculars (ISC licence).
 */
export const BinocularsIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M10 10h4" />
    <path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" />
    <path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z" />
    <path d="M22 16H2" />
    <path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z" />
    <path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3" />
  </Svg>
);

/**
 * For sale: a price tag, with the hole its string goes through. Filled for
 * the active tab, the hole knocked out of the fill.
 */
export const TagIcon = ({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) => (
  <Svg {...props}>
    <path
      fill={filled ? 'currentColor' : 'none'}
      d="M3.5 12.1V5A1.5 1.5 0 0 1 5 3.5h7.1a1.5 1.5 0 0 1 1.06.44l7.4 7.4a1.5 1.5 0 0 1 0 2.12l-7.1 7.1a1.5 1.5 0 0 1-2.12 0l-7.4-7.4a1.5 1.5 0 0 1-.44-1.06z"
    />
    <circle
      cx="8.2"
      cy="8.2"
      r="1.2"
      stroke={filled ? 'var(--snt-bg-surface)' : 'currentColor'}
      fill={filled ? 'var(--snt-bg-surface)' : 'none'}
    />
  </Svg>
);

/**
 * A storefront, as marketplaces draw one: a scalloped awning over a shop
 * with a door. Marks a seller as a shop or dealer rather than a person.
 */
export const StorefrontIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 9l1.6-5h14.8L21 9" />
    <path d="M3 9a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0" />
    <path d="M5 12.5V20h14v-7.5" />
    <path d="M10 20v-4.5h4V20" />
  </Svg>
);

export const StarIcon = (props: IconProps) => (
  <Svg weight={1.9} {...props}>
    <path d="M12 4l2.3 4.9 5.2.7-3.8 3.6 1 5.3-4.7-2.6-4.7 2.6 1-5.3-3.8-3.6 5.2-.7z" />
  </Svg>
);

/**
 * Save. The v1 app's star — an outline when not saved, solid when saved —
 * carried over so saving looks the way it always has.
 */
export const SaveStarIcon = ({
  size = 20,
  title,
  filled = false,
  ...rest
}: IconProps & { filled?: boolean }) => (
  <FilledSvg size={size} title={title} viewBox="0 0 66.41 63.25" {...rest}>
    {filled ? (
      <path d="M21.66,40.55c.42-1.3-.04-2.71-1.14-3.51L4.82,25.64H24.22c1.37,0,2.57-.87,2.99-2.17l6-18.45,6,18.45c.42,1.3,1.62,2.17,2.99,2.17h19.4l-15.7,11.4c-1.1,.8-1.56,2.21-1.14,3.51l6,18.45-15.7-11.4c-.54-.39-1.18-.6-1.85-.6s-1.31,.21-1.85,.6l-15.7,11.4,6-18.45Z" />
    ) : null}
    <path d="M33.2,12.13l3.9,12.01c.72,2.21,2.76,3.69,5.08,3.69h12.63l-10.22,7.42c-1.88,1.36-2.66,3.76-1.94,5.97l3.9,12.01-10.22-7.42c-.92-.67-2-1.02-3.14-1.02s-2.22,.35-3.14,1.02l-10.22,7.42,3.9-12.01c.72-2.21-.06-4.61-1.94-5.97l-10.22-7.42h12.63c2.32,0,4.36-1.48,5.08-3.69l3.9-12.01m0-12.13c-.38,0-.75,.22-.9,.65l-7.19,22.14c-.13,.39-.49,.65-.9,.65H.94c-.91,0-1.29,1.17-.55,1.7l18.83,13.68c.33,.24,.47,.66,.34,1.05l-7.19,22.14c-.21,.66,.31,1.24,.9,1.24,.18,0,.37-.06,.55-.18l18.83-13.68c.16-.12,.36-.18,.55-.18s.39,.06,.55,.18l18.83,13.68c.18,.13,.37,.18,.55,.18,.59,0,1.11-.58,.9-1.24l-7.19-22.14c-.13-.39,.01-.81,.34-1.05l18.83-13.68c.74-.54,.36-1.7-.55-1.7h-23.28c-.41,0-.77-.26-.9-.65L34.1,.65c-.14-.43-.52-.65-.9-.65h0Z" />
  </FilledSvg>
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
