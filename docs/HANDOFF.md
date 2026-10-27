# Handoff: where the redesign stands

Written on 2026-10-22 to carry the work to a new Claude account, and
brought up to date on 2026-10-26, 2026-10-27 (the second account change),
twice more later on 2026-10-27, and at the end of the long 2026-10-27
backend session (Phases 1 to 3 and Phase 4 slice 1). The rules for working
on this repo are in `/CLAUDE.md`; read that first. This file is the state of
the code and the recent work. **Start with "Where we stopped" below**, then
`docs/architecture/backend-plan.md` ("Where it stands") for the backend in
full.

## The project

Swap & Top is a Zimbabwean marketplace for phones, laptops, consoles and
parts, built around the swap: offer what you have, add cash on top. People
post items for sale, swaps and Wanted listings; stores get a Store
console with stock, leads, offers and stats. The product docs live in
`docs/` (start at `docs/00-SUMMARY.md`).

**State, end of 2026-10-27.** The app has a real backend: Postgres on
Supabase, Drizzle, a Hono API in `apps/api` served by the web app at `/api`
(Swagger at `/api/docs`), deployed with the site on Vercel. Every page a
person uses reads and saves through it: the feed, listing pages, search,
Wanted, posting, My listings (pause, sold, delete, relist), offers (send,
accept, decline, withdraw, undo), deal checks, saved listings, notifications,
store pages, and opening a store. Sign in is real (Supabase Auth): email and
password from a three step sign up, or phone and a one time code. Email and
phone codes are **mock ones (123456)**, nothing is sent, until real email and
SMS are set up. A phone is optional to join; posting and sending offers ask
for a verified phone first.

Still on the mock data: the **Store console** (Phase 4 slice 3), and other
people's names, store badges and deal counts on cards and offers (from the
mock people and stores, whose ids match the database).

The **database is shared** by localhost and the live site: anything posted,
saved or answered on either shows on both. Clean up test data you make, and
`pnpm --filter @snt/api db:seed-activity` puts the sample offers, deal
checks, saved listings and notifications back.

Roles (user, moderator, admin, super admin) are on the person; person, free
store and paid store are not roles but store membership and passes.

## Repo layout

pnpm workspace with Turborepo.

| Path | What it is |
|---|---|
| `apps/web` | Next 15.5 (App Router), React 19. Pages under `src/app`, shared page parts under `src/components`, browser helpers under `src/lib` (Supabase client, `apiAsViewer`, account data loading, listings and stores read on the server). Serves the API at `/api` through `src/app/api/[[...route]]/route.ts`. |
| `apps/api` | `@snt/api`: the Hono API. `src/db/schema.ts` (21 tables), `src/db/seed.ts` and `seedActivity.ts`, `src/routes/*` (one file per area), `src/auth.ts` (token check), `src/supabaseAdmin.ts` (admin calls, `MOCK_CODE`). Also runs on its own on port 4000. |
| `packages/ui` | `@snt/ui`: the component library, CSS Modules. Cards, layout (headers, tabs, menus, footer, console shell), offers, primitives. |
| `packages/core` | `@snt/core`: types, mock data (`src/mock`), Zustand stores (`src/stores`), helpers. |

Commands: `pnpm dev` (the user usually has it running on port 3000),
`pnpm -s typecheck`, `pnpm build`. API: `pnpm --filter @snt/api dev` (on
its own, port 4000), `db:seed` (everything back to the start, empties all
tables), `db:seed-activity` (just offers, deal checks, saved and
notifications), `db:generate` and `db:migrate` (after changing the schema).

Settings: the root `.env` (git ignored) holds `DATABASE_URL` and the four
`SUPABASE_` values; `apps/web/.env.local` holds `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Vercel has all of them for
Production and Preview, and `turbo.json` lists them so the build sees them.
Never print the secret values.

Branch: all work is on `redesign/pdf-style`, fast forwarded into `main` when
the user asks. `main` deploys live.

## Test accounts and data you will meet

Sign in with a phone (Continue with phone) and the code **123456**:

| Number | Who | Notes |
|---|---|---|
| 077 000 0001 | Tarisai M. (`u-tarisai`) | A person. Also email `tarisai.test@example.com`, password `testpass123`. Owns the MacBook swap and the PS5 controller Wanted listing. |
| 077 000 0002 | Avondale Games owner (`u-avgames`) | A free store, `s-avondale-games`. |
| 077 000 0003 | Tinashe K. (`u-kopje`) | Owner of Kopje Computers (`s-kopje`), a paid store with a month pass. |
| 077 000 0004 | Kuda S. (`u-kuda`) | Staff at Kopje Computers. |
| 077 000 0005 | Rumbi M. (`u-rumbi`) | Moderator. |
| 077 000 0006 | Tafadzwa A. (`u-tafadzwa`) | Admin. |
| 077 000 0007 | Hillary M. (`u-hillary`) | Super admin. |

Only these seven numbers can sign in by phone (Supabase test numbers); any
other number needs real SMS. Any Zimbabwe number can be *verified* in
Settings or the verify phone sheet with 123456. Sign up with any email
works (code 123456). A leftover test account, Nyasha C.
(`signup.test@example.com`), is still in the database; ask before deleting.

The mock data in `packages/core/src/mock` is what the database was seeded
from, and what the Store console and other people's details still read:

| Who | Id | Notes |
|---|---|---|
| Tarisai M. | `u-tarisai` | The signed in test user (`CURRENT_USER_ID`). Owns the MacBook swap (`l-macbook-swap`) and the PS5 controller Wanted listing (`l-ps5-controller-wanted`). |
| Kopje Computers | `u-kopje`, store `s-kopje` | The store (`currentStore`) shown in the console. |
| Chipo N., Rudo K., Blessing T., Tendai C., Farai D., Nyasha P., Avondale Games | `u-chipo`, `u-rudo`, `u-blessing`, `u-tendai`, `u-farai`, `u-nyasha`, `u-avgames` | Other people offering or posting. |

Sponsored in the mock (`useSponsorStore`): the Dell Latitude 7490 (Kopje's,
the only one the console shows), and other people's iPhone 11 128GB (sale),
PS4 Slim for an Xbox One S and Galaxy A34 for a Pixel 7a (swaps), RTX 3060
or Better and Galaxy S21 or newer (Wanted), so the Sponsored badge can be
seen on every kind of card. Notifications: `mock/notifications.ts`. Deal
checks: `mock/deals.ts`. Stats figures: `mock/stats.ts`.

Sample offers (`SAMPLE_OFFERS` in `useOfferStore.ts`), deal checks
(`mock/deals.ts`), saved listings (`SAMPLE_SAVED`) and notifications
(`mock/notifications.ts`) are seeded into the database by `seedActivity`.
Tarisai receives three offers (two on the MacBook, one on the PS5
controller) and has sent four, one in each state.

## Design system in practice

Tokens are in `packages/ui/src/styles/tokens.css`. The ones used most:

- Blues: `--snt-control-active` (#2f7599, the main interactive blue),
  `--snt-accent-bold` (headings), `--snt-accent-strong`.
- Backgrounds: `--snt-bg-app` (page), `--snt-bg-card`/`--snt-bg-surface`
  (white), `--snt-bg-inset` (#ebf2ff).
- Others: `--snt-alert` (#d92d20, the app's red), `--snt-success`,
  `--snt-wanted-ink` / `--snt-wanted-fill` (Wanted green), brand blue,
  green and yellow (#ffff8b).
- Spacing: space-1 = 2px, 2 = 4, 3 = 6, 4 = 8, 5 = 10, 6 = 12, 7 = 14,
  8 = 16, 10 = 20, 12 = 24, 16 = 32. Radius md = 12, lg = 14, xl = 18.
- Weights: there is `--snt-weight-normal` (400), no "regular".

Patterns the user has settled on:

- **Icon tiles.** Icons sit on a small rounded square. Usually a see through
  wash of the icon's own colour:
  `color-mix(in srgb, currentColor 12%, transparent)`. On the page background,
  `color-mix(in srgb, var(--snt-control-active) 12%, transparent)`.
- **Tabs are a segmented switch** (`packages/ui/src/layout/Tabs.tsx`): a pale
  blue strip, a blue block that slides to the chosen tab, counts in tinted
  rounds, optional icons on tinted tiles, a `short` label for phones, `fill`
  for even widths. Used on the feed (laptop), My listings
  (All, Swaps, For Sale, Wanted), Saved, Offers, shop pages. The Leads tabs
  in the console (`apps/web/src/app/console/leads/LeadTabs.tsx`) are the
  original version and still separate code.
- **Listings are white; offers are pale blue.** An offer card
  (`packages/ui/src/offers/OfferCard.tsx`) is compact, on
  `color-mix(control-active 12%, bg-app)`, like a reply under a post.
- **Offers hang off a thread line**, like comments: "Offers on this
  listing" with the count in a round, flush left with the listing, then a
  solid line down the left that curves into the middle of each offer
  (`.rail` in `Offers.module.css`, `.offers` in
  `apps/web/src/components/offers/OfferGroups.module.css`, shared by the
  profile's and the console's Offers pages; the line colour is solid, not
  transparent, so overlaps do not darken).
- **Status pills** (Live, Accepted, Declined) are a faded wash of their own
  colour, never a solid fill.
- **Gaps.** Under the header band (search, chips, tabs) to the first
  listing: 12px on a phone, 20px from tablet up, except the feed which keeps
  12px under its sticky tabs. Between the chips and the tabs: 12px.
- **Calls to action** are the yellow of Post New Item with its green ink
  (`--snt-brand-yellow`, `--snt-post-ink`), as on the Sponsor banner.
- **"New" and "Sponsored"** badges use the brand gradient (`Badge
  tone="brand"`). "Sponsored" always sits top right: on the photo of a
  sale, on a swap's "Looking for" tile (the card's top right corner), and
  at the right of a Wanted card's top row with the responses and time
  under it. The type (Wanted, Swap) keeps the top left. "New" on Leads stays
  on the left: it is for dealers to act on.
- **Boost, not sponsor, for the seller.** Everything the seller does says
  "boost" ("Boost this listing", "Boost a listing", "Boosted listings",
  "Boosted until …", "Extend boost", "Stop boost", the Stats card "Boosts").
  Only the label buyers see on a card stays "Sponsored". Code names
  (`useSponsorStore`, `SponsorSheet`) keep "sponsor".
- **Store, never dealer, in code too.** Code names say store:
  `allowStoreOffers`, `contactToStores`, `contactOpenToStores`,
  `VerifiedStoreBadge`, `ownsStore`, the role `'store'`, and the console doc
  is `docs/product/store-console.md`. "Shop" is gone from the code too:
  `Store`, `storeId`, `currentStore`, `getStore`, `useStoreStock`,
  `mockStores` (`mock/stores.ts`, `types/store.ts`), the `Storefront`
  component, `StoreMark`, `--snt-store-mark`. Only the design file's frame
  names (`DetailDealer`, `Shopfront`) keep the old words.
- **Store, not shop, in what people see.** A dealer's page is a store:
  "Store profile" (storefront icon, "Store" on the phone bar), addresses
  `/store/<slug>` and `/console/store`. The old `/shop/...` and
  `/console/shop` redirect there (`apps/web/next.config.ts`).
- **Boosting lives in Stock.** Stock has two tabs, Stock and Boosted
  (`stockTab` in `useConsoleStore`). Boosted (`console/stock/BoostedTab.tsx`):
  a yellow "Boost a listing", each boosted listing with "Until … · $3 a day
  · 12 reveals since" and a menu (Extend boost, View as a buyer, Stop boost
  with Undo), then "Worth boosting": the three live items with the most
  reveals, each with a yellow Boost button. Stock rows keep Boost this
  listing / Extend boost / Stop boost in their menu, and the edit page keeps
  its banner. Stats keeps a Boosts card whose "Boosted listings" button
  opens Stock on the Boosted tab. The separate Sponsored items page was
  removed.
- **Settings** use the gear (`SettingsIcon`). Information pills are not
  buttons; the action beside them is a real button.
- **Never restyle a `Panel` with another background.** Two styles of equal
  weight: the production build loads them in a different order than the dev
  server, so it looked right locally and wrong on Vercel (the offer cards
  came out white). Give the thing its own box instead.

## What was built recently (newest first)

See `git log` for the full detail; each commit body explains its change.

- **2026-10-27, backend session** (`5a25f1c` to `12faafa`): the backend
  plan, Phases 1 to 3 and Phase 4 slice 1. In order:
  - **Phase 1, schema and seed** (`5a25f1c`): 21 tables with row level
    security (the public key reads nothing), seed from the mock data, the
    first read endpoints, Swagger; the API served by Next at `/api`.
  - **Phase 2, sign in and accounts** (`4876ad8`, `30e43e1`, `582045e`):
    Supabase Auth; the auth pages to the first app's arrangement and 3D
    pictures on one frame (`signin/AuthLayout.tsx`): sign in (email first,
    Continue with phone, Google and Facebook not connected), a three step
    sign up with steps along the top (details; neighbourhood, town and
    password; email code), forgot password, reset; verify your phone in
    Settings and as a sheet before posting or offers; a name sheet for
    phone sign ups. Build and Turbo fixes for Vercel settings.
  - **Phase 3, pages on the API** (`f1962ff`, `3192a93`): feed and listing
    pages built on the server from the database (kept a minute, refreshed
    at once after a post or change), posting, My listings and owner
    actions, offers, deal checks, saved, notifications (a new offer and its
    answer notify the other person), search and Wanted.
  - **Phase 4 slice 1** (`12faafa`): listing limits (5 person, 15 free
    store, none with a pass; Wanted never counts) with the limit sheet,
    Open a store (`/store/new`), store pages from the database, Post as.
- **2026-10-27, third session** (`70e2dea`, `6ea172c`):
  - **Accounts and stores decided** (docs only, nothing built):
    `docs/product/accounts-and-stores.md`, decisions B16 to B19 and P31 to
    P37, with dated notes in monetization, trust and safety, sign in and
    identity, and the console doc. Summary under "Decided, not built" below.
  - **Store everywhere, never dealer or shop.** Visible text: Store
    console, Verified store (the feed cards' "Verified Seller" too),
    "For stores" and "Switch to Store console" on the profile, "accepts
    offers from stores", "Let stores send me offers", "Let stores see my
    contact details", "Stores come to you".
  - **The code follows.** `allowStoreOffers`, `contactToStores`,
    `contactOpenToStores`, `VerifiedStoreBadge`, `ownsStore`, the role
    `'store'`; and Shop renamed to Store throughout: `Store`, `storeId`,
    `currentStore`, `getStore`, `getStoreBySlug`, `useStoreStock`,
    `useStoreSponsorships`, `mockStores`, `mockStoreReveals`, the
    `Storefront` component (`components/Storefront.tsx`), `StoreMark`,
    `StoreIcon`, `--snt-store-mark`, files `types/store.ts` and
    `mock/stores.ts`. The console doc is now
    `docs/product/store-console.md`. Only the design file's frame names,
    `DetailDealer` and `Shopfront`, keep the old words.
- **2026-10-27, second session** (`c5ebf63`, back on the first account):
  - **Boost, not sponsor, for sellers.** Every seller facing word says boost
    ("Boost this listing", "Boost a listing", "Boosted until …", "Extend
    boost", "Stop boost", the Stats card "Boosts"); buyers still see the
    "Sponsored" badge. Code names keep "sponsor".
  - **Boosting lives in Stock**, with **Stock and Boosted tabs**
    (`stockTab` in `useConsoleStore`; text width on a laptop, full width on a
    phone). The Boosted tab (`console/stock/BoostedTab.tsx`): a yellow "Boost
    a listing", each boost with "Until … · $3 a day · N reveals since" and a
    menu (Extend boost, View as a buyer, Stop boost with Undo), then **Worth
    boosting**, the three live items with the most reveals, each with a
    yellow Boost button. Stock rows' menus have Boost / Extend / Stop boost.
    The Sponsored items page under Stats was removed; Stats' "Boosted
    listings" opens the Boosted tab. The two Stats buttons share a row on a
    phone.
  - **Boost sheet**: "Which listing" is a dropdown of the boostable items
    (live, for sale, not boosted already), the chosen one shown under it.
  - **Stores, not shops.** "Store profile" with the storefront icon
    ("Store" on the phone bar); addresses `/store/<slug>` and
    `/console/store`, old `/shop/…` and `/console/shop` redirect
    (`apps/web/next.config.ts`). Visible copy says store; code names keep
    "shop".
  - **Sponsored in the top right** on every card: a sale's photo, a swap's
    "Looking for" tile, the right of a Wanted card's top row with the
    responses and time under it. "New" on Leads stays on the left.
  - **Feed spacing**: one sponsored listing after every three others, never
    two together; extras wait rather than piling up at the end
    (`interleaveSponsored` in `useFeedStore.ts`).
  - **Deal check pills** on Leads, Number reveals: "Deal check in 3 days"
    (was "Asking them in 3 days"), and every pill explains itself on hover
    (browser tooltip); an "Answer needed" pill opens the check too.
  - **Close buttons**: the boost banner's X is a pale green round, dark green
    with a white X on hover; the header menu's X turns blue with a white X
    on hover, as the sheets' do.
  - **Console header on a phone**: the store's initials tile is hidden below
    420px wide so the name fits beside the bell.
- **2026-10-27, first session** (on the second account):
  - **Sponsored slots, built out** (Promote's place, at the foot of Stats).
    A daily budget like boosting a post on WhatsApp: a slider from $1 a day
    (to $100), with about how many people a day it reaches, for 1 day, 1
    week or 1 month; the total shown. **Every payment goes through Paynow's
    own page** (EcoCash, OneMoney, Telecash, ZimSwitch, Visa, Mastercard are
    named, chosen on Paynow), mocked until the Paynow account is live; see
    docs/operations/payments-and-invoicing.md for going live. One sheet:
    `apps/web/src/components/sponsor/SponsorSheet.tsx` (plan, pay, on
    Paynow, done). State: `packages/core/src/stores/useSponsorStore.ts`
    (`promotionOf`/`withPromotion` feed the feed, cards and Stock).
  - **Anyone can sponsor any live listing.** A yellow "Sponsor this item"
    banner with an X (`SponsorBanner`) sits on top of a dealer's item in
    Stock (edit page) and a person's own listing page; once sponsored it is
    "Sponsored until … · $3 a day" with Extend. Stock's item menu has
    "Sponsor this item" too.
  - **Sponsored items** page (since removed: boosting moved to Stock) (`/console/stats/sponsored`, from Stats'
    "Manage sponsored items", not in the menu): a table of the shop's own
    sponsorships with Extend, View as a buyer, Stop sponsoring (Undo).
  - **Lead alerts** left Stats; their price and renewal show at the top of
    their settings sheet on Leads. The lead alerts pill is information only;
    a "Lead alert settings" button with a gear opens the sheet.
  - **Friday Drop paused** (decision P30): out of the console and mock;
    the plan is kept in docs/business/monetization.md.
  - **Notifications**: a bell with an unread count in the marketplace
    header (`/notifications`) and in the console (phone header bell; top of
    the laptop sidebar; `/console/notifications`). One list, unread lines in
    blue and bold with a blue dot, Mark all as read
    (`components/notifications/NotificationList`, `useNotificationStore`).
  - Offer cards fixed for production (their own box, not a restyled Panel).
  - Deal check: no ticks on "Yes, we completed it" or the record number.
  - Header logo: the stacked mobile one below 580px wide.
  - Seven more mock listings from private sellers (three swaps, three
    Wanted, one sale), reusing photos of the same models.
- **2026-10-26 session** (one commit):
  - Profile: "My wanted posts" row removed; **Deals to confirm** is a list
    (`/me/deals`, To confirm and Answered) of deal checks, each opening
    `/deals/<id>/confirm`.
  - **Deal checks** start from an accepted offer (both asked) or a signed in
    number reveal (the revealer first, the owner only after a yes); guest
    reveals ask nobody. Roles are asker and owner. Decision P27.
  - **Contact toggle** on every post: "Only share my contact details after
    I accept an offer"; with it on, "Let dealers see my contact details".
    Such listings show only the offer button and say "Offers only" on their
    feed cards. Decision P28.
  - **One kind of offer**: "Make an offer" everywhere, one form. On a sale,
    "Just cash" where the price moves, plus swap choices where it takes
    swaps. Sales take offers when negotiable, accepting swaps, or contact
    after offer. Decision P29.
  - **Toasts** always in front: one toaster, moved into an open sheet;
    sheets animate an inner panel, not the dialog.
  - **Dealer console**: Promote is now **Stats** (`/console/stats`: time
    switch, four numbers, bar graph, best items, lead sources, promotion at
    the foot; mock data in `packages/core/src/mock/stats.ts`). Swap offers
    is now **Offers** with Received and Sent, laid out as the profile's
    Offers page (shared `components/offers/OfferGroups`); Leads keeps
    Matching requests and Number reveals. Number reveals rows name the
    person only once they say a deal happened, and only "Answer needed"
    rows open (the shop's deal check). Matching requests restyled as the
    Wanted card; swaps there and in the Wanted feed read "Swap", not
    "Wanted + Swap".
  - Sign in is remembered in local storage until you sign out.
  - CLAUDE.md rule 10: keep it simple, fewest taps, only what was asked.
- **2026-10-22, committed with the first version of this file:**
  - My listings tabs split into All, Swaps, For Sale (Sale on a phone),
    Wanted, as on the feed.
  - Even tabs tighten on narrow phones; the sliding block re-measures when
    any tab changes width.
  - The "This person accepts offers from dealers" note is hidden on your
    own Wanted listing (shown to everyone else, and in View as a buyer).
  - On offers, the shop or person icon sits 3px from the name.
  - 20px from the header band to the first listing from tablet up.
- `fddc7a2` Your own listing cards count "Offers on this listing" under your
  name, with save and share in the bottom corner; no offers button or
  response count on your own Wanted card.
- `1aa00c2` The Offers page (`/me/offers`): each listing summarised (photo,
  kind, status, name, terms, "View this listing") with its offers under it
  on the thread line, for Received and Made. Offer cards smaller and pale
  blue, price labels ("Their price", "You add") small and grey over the
  amount. Accepted offers show contact tiles (WhatsApp and Call side by side
  on a phone; Email and Messenger full width). Withdrawing closes the offer
  sheet. Toasts on a phone sit just above a bottom bar, or 12px from the
  foot when there is none (`apps/web/src/components/ToastOffset.tsx`, bars
  marked `data-bottom-bar`).
- `f2b3bea` Segmented tabs everywhere; the header logo and the footer's
  Homepage link always open the feed on All (`HomeLink`); bigger, full width
  social icons in the menu.
- `d4b8dd2` and earlier: console header and phone menu, footer, lead alerts,
  Leads tables, icon tiles, the app menu, help and legal pages, sign in,
  loading skeletons, the post form, swap language everywhere.

## Known loose ends and ideas offered

- **Where we stopped (end of the 2026-10-27 backend session):** Phases 1
  to 3 are built and live; Phase 4 slice 1 is built and live. Everything is
  committed and pushed (`main` deploys live). **Next: Phase 4 slice 2,
  store passes**, then slices 3 and 4, then Phase 5:
  - **Slice 2, store passes:** buy a day ($1), week ($5) or month ($15)
    pass for a store (owner only); extending tops up from the current end;
    the day before it ends a reminder (a notification); when it ends the
    store keeps its 15 most recently updated listings live and pauses the
    rest, all live again with a new pass. Payment is a **test payment**
    until Paynow is set up (the owner needs a Paynow merchant account;
    integration id and key would go in `.env` and Vercel). The tables
    `store_passes`, `payments` and `payment_events` exist; the limit check
    already reads passes (`overLimit` in `apps/api/src/routes/post.ts`).
    The lapse needs a check on read or a scheduled job (Vercel cron).
  - **Slice 3, the Store console on real data:** stock, leads, trade ins
    (offers on store listings), stats, the store's notifications, boosts;
    open only while a pass covers today.
  - **Slice 4, owner and staff:** the owner adds staff by phone and removes
    them; staff can do stock, offers and leads, not payments, verification,
    staff or settings.
  - **Also in Phase 4, not built:** moving existing listings into a new
    store, a store's own contact ways and settings (name change rules),
    Verified store requests (checked by staff), closing a store.
  - **Phase 5, the report queue for staff:** report a listing or person;
    a phone friendly queue (claim, approve, change the reason, clear);
    appeals for admins. Tables `reports`, `moderation_actions` and
    `appeals` exist. See `docs/architecture/backend-plan.md`, section 2.
- **Gaps in what is built:** photos are not uploaded (new listings show the
  grey placeholder); editing a listing is not built; Show contact does not
  ask for a verified phone yet; deal checks, expiring listings and leads
  send no notifications yet; Google and Facebook sign in are not connected;
  email and phone codes are mock (123456) and would work on the live site
  for anyone until real email (Supabase SMTP) and SMS (a provider in place
  of the Twilio placeholders) are set up; Supabase Redirect URLs need
  `http://localhost:3000/**` and the Vercel address for real reset links;
  other people's names and badges on cards come from the mock data; the
  Me page's own stats (listings, reveals) still use the mock.
- The feed shows one sponsored listing per three others, so on short type
  tabs (Swaps, Wanted) only one of two sponsored shows; spacing every two
  was offered, not built.
- The deal check pills' explanations are browser tooltips: they show on a
  laptop only, not on a phone.
- The desktop app sometimes starts its own preview server on port 3001
  when a session reopens; stopping it from Claude was refused, so ask the
  user to stop it if pages lose their styles.
- The budget slider runs $1 to $100, so each dollar is a tiny movement on a
  phone; a lower top or minus and plus buttons were offered, not built.
- On sale and swap cards' bottom line, the place and age get trimmed first
  when space is short ("Gre… · Offers only").
- Paynow is mocked: a boost payment "succeeds" after three seconds.
  Nothing is really charged; boosts live in memory (`useSponsorStore`), not
  the database yet.
- **With the API: one home per account.** A dealer's own profile should
  point shop matters (My listings, Offers, shop deal checks) to the console
  rather than repeat them; only personal things (Saved, Settings) stay in
  the profile. See docs/product/store-console.md, "One home per account".
- The Leads tabs could move onto the shared `Tabs` component.
- Made offers are listed in store order, not strictly newest first; real
  dates would allow sorting.
- No sample person has both WhatsApp and Call, so the side by side contact
  pair on a phone has not been seen on screen.

## Testing tips

- **Test against the API with curl:** sign in a test number through
  Supabase (`/auth/v1/otp` then `/auth/v1/verify` with token 123456, using
  the publishable key from `.env`), then call `http://localhost:3000/api/...`
  with `Authorization: Bearer <access_token>`. Swagger at `/api/docs` lists
  every endpoint.
- **Clean up test data** in the shared database: delete test listings
  (and their items and details) and test stores you made, and run
  `db:seed-activity` after changing offers, deal checks, saved or
  notifications. Name test data "Test …" so it is easy to find.
- One-off database scripts: run from `apps/api` with Node, load the root
  `.env`, and use the transaction pooler (`DATABASE_URL` with port 6543) so
  they do not compete with the dev server for the session pooler's 15
  connections.
- The browser pane often does not paint until a screenshot is taken, and a
  page can look unhydrated for a long while. Read state with
  `javascript_tool` (and wait a few seconds) rather than trusting the first
  screenshot.

- The Claude browser pane can be hidden, which throttles
  `requestAnimationFrame` and transitions: screenshots may be stale or caught
  mid animation. Measure with JavaScript (`getBoundingClientRect`) when in
  doubt, and wait a moment before screenshots.
- Clicking before hydration does nothing; wait, or navigate with
  `window.next.router.push(path)`.
- Editing a file in `packages/core` or some `packages/ui` files triggers a
  full reload, which resets offers and the like; you stay signed in.
- Check phones at 375 by 812 and laptops at about 1024 wide.
- One dev server only. On 2026-10-26 the desktop app started a second
  preview server on 3001 by itself when the session reopened, and pages lost
  their styles (CSS 404s); run `preview_list` and stop the stray one.
- Clicks in the browser pane sometimes fail while the tool safety checker is
  unavailable; a click done through `javascript_tool` usually still works,
  and file edits can go through the Edit and Write tools.
