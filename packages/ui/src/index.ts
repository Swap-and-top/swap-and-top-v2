/**
 * @snt/ui — the web component library.
 *
 * Web-only: these use DOM elements and CSS Modules, neither of which React
 * Native can consume. Anything a future native app also needs — types, stores,
 * tokens, mock data — lives in `@snt/core`.
 *
 * ── How this is organised ──────────────────────────────────────────────────
 *  primitives/  the small pieces: buttons, chips, badges, fields, panels
 *  cards/       the four listing cards plus their compact forms
 *  layout/      screen scaffolding, headers, navigation, the console shell
 *  icons/       inline SVG icons, one per glyph
 *  styles/      tokens.css and reset.css, imported once by the app
 *
 * Every component keeps its CSS next to it as a `.module.css` file, so a change
 * to one screen cannot leak into another.
 */

/* --- primitives ---------------------------------------------------------- */
export { Badge, CountBadge, StatusBadge } from './primitives/Badge';
export type { BadgeProps, BadgeTone } from './primitives/Badge';

export { Button, ButtonLink } from './primitives/Button';
export type {
  ButtonProps,
  ButtonLinkProps,
  ButtonSize,
  ButtonVariant,
} from './primitives/Button';

export { Chip, ChipRow, ChipWrap } from './primitives/Chip';
export type { ChipProps, ChipTone } from './primitives/Chip';

export {
  CheckboxField,
  Field,
  FieldRow,
  Segmented,
} from './primitives/Field';
export type { FieldProps, SegmentedOption } from './primitives/Field';

export { ConsoleEntryRow, ListGroup, ListRow } from './primitives/ListRow';

export { ImageCarousel, PhotoGallery } from './primitives/PhotoGallery';
export type { PhotoTone } from './primitives/PhotoGallery';

export {
  Avatar,
  ImagePlaceholder,
  ShopMark,
  firstPhoto,
  listingPhoto,
} from './primitives/Placeholder';
export type { ImagePlaceholderProps } from './primitives/Placeholder';

export {
  SpecGrid,
  specParts,
  specRowsFor,
  specSummary,
} from './primitives/SpecGrid';
export type { SpecRow } from './primitives/SpecGrid';

export { StatStrip } from './primitives/StatStrip';
export type { Stat } from './primitives/StatStrip';

export { Divider, Panel, Section, Stack } from './primitives/Surface';
export type { StackGap } from './primitives/Surface';

export {
  Body,
  Caption,
  CashAmount,
  Eyebrow,
  ItemName,
  Meta,
  Note,
  PageHeading,
  Price,
  ScreenTitle,
} from './primitives/Text';

export {
  ConfirmedDealsBadge,
  VerifiedDealerBadge,
} from './primitives/Trust';
export type { TrustSize } from './primitives/Trust';

/* --- cards --------------------------------------------------------------- */
export { CompactListingRow, GridCard, GridCardList } from './cards/CompactCards';
export { PosterRow, ShopRow } from './cards/IdentityRow';
export { LeadCard } from './cards/LeadCard';
export { ListingCard } from './cards/ListingCard';
export { SaleCard } from './cards/SaleCard';
export type { SaleCardProps } from './cards/SaleCard';
export { SwapCard, SwapTiles } from './cards/SwapCard';
export type { SwapSide } from './cards/SwapCard';
export { WantedCard } from './cards/WantedCard';

/* --- layout -------------------------------------------------------------- */
export { BottomNav } from './layout/BottomNav';
export { ConsoleShell } from './layout/ConsoleShell';
export {
  AppHeader,
  HeaderIconButton,
  ScreenHeader,
  StepHeader,
} from './layout/Headers';
export { Logo } from './layout/Logo';
export {
  Band,
  EmptyState,
  Screen,
  ScreenBody,
  ScreenFooter,
  Tabs,
} from './layout/Screen';
export type { TabItem } from './layout/Screen';

/* --- helpers ------------------------------------------------------------- */
export { monthYear, replyLabel, replyShort } from './format';
