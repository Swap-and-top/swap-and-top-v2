# Handoff: where the redesign stands

Written on 2026-10-22 to carry the work to a new Claude account, and
brought up to date on 2026-10-26. The rules
for working on this repo are in `/CLAUDE.md`; read that first. This file is
the state of the code and the recent work.

## The project

Swap & Top is a Zimbabwean marketplace for phones, laptops, consoles and
parts, built around the swap: offer what you have, add cash on top. People
post items for sale, swaps and Wanted listings; dealers (shops) get a
console with stock, leads, offers and stats. The product docs live in
`docs/` (start at `docs/00-SUMMARY.md`).

Everything runs on mock data in the browser for now. There is no backend:
stores hold state in memory, so a full page reload resets offers, saves and
deal answers. Signing in is the exception: it is kept in local storage
(`snt-session`) until you sign out.

## Repo layout

pnpm workspace with Turborepo.

| Path | What it is |
|---|---|
| `apps/web` | Next 15.5 (App Router), React 19. Pages under `src/app`, shared page parts under `src/components`. |
| `packages/ui` | `@snt/ui`: the component library, CSS Modules. Cards, layout (headers, tabs, menus, footer, console shell), offers, primitives. |
| `packages/core` | `@snt/core`: types, mock data (`src/mock`), Zustand stores (`src/stores`), helpers. |

Commands: `pnpm dev` (the user usually has it running on port 3000),
`pnpm -s typecheck`, `pnpm build`.

Branch: all work is on `redesign/pdf-style`, fast forwarded into `main` when
the user asks. `main` deploys live.

## Mock data you will meet

| Who | Id | Notes |
|---|---|---|
| Tarisai M. | `u-tarisai` | The signed in test user (`CURRENT_USER_ID`). Owns the MacBook swap (`l-macbook-swap`) and the PS5 controller Wanted listing (`l-ps5-controller-wanted`). |
| Kopje Computers | `u-kopje`, shop `s-kopje` | The dealer (`currentShop`) shown in the console. |
| Chipo N., Rudo K., Blessing T., Avondale Games | `u-chipo`, `u-rudo`, `u-blessing`, `u-avgames` | Other people offering or posting. |

Sample offers are in `packages/core/src/stores/useOfferStore.ts`. Tarisai
receives three (two on the MacBook, one on the PS5 controller) and has sent
four, one in each state: pending (Redmi Note 12; Dell Inspiron towards
Kopje's ThinkPad), accepted (RX 580 for Blessing's GTX 1650), declined
(memory for Rudo's Wanted).

Signing in on the mock: go to `/signin?next=<path>` and press Sign in with
the boxes empty.

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
  `apps/web/src/app/me/offers/page.module.css`; the line colour is solid, not
  transparent, so overlaps do not darken).
- **Status pills** (Live, Accepted, Declined) are a faded wash of their own
  colour, never a solid fill.
- **Gaps.** Under the header band (search, chips, tabs) to the first
  listing: 12px on a phone, 20px from tablet up, except the feed which keeps
  12px under its sticky tabs. Between the chips and the tabs: 12px.

## What was built recently (newest first)

See `git log` for the full detail; each commit body explains its change.

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

- **With the API: one home per account.** A dealer's own profile should
  point shop matters (My listings, Offers, shop deal checks) to the console
  rather than repeat them; only personal things (Saved, Settings) stay in
  the profile. See docs/product/dealer-console.md, "One home per account".
- The Leads tabs could move onto the shared `Tabs` component.
- Made offers are listed in store order, not strictly newest first; real
  dates would allow sorting.
- No sample person has both WhatsApp and Call, so the side by side contact
  pair on a phone has not been seen on screen.

## Testing tips

- The Claude browser pane can be hidden, which throttles
  `requestAnimationFrame` and transitions: screenshots may be stale or caught
  mid animation. Measure with JavaScript (`getBoundingClientRect`) when in
  doubt, and wait a moment before screenshots.
- Clicking before hydration does nothing; wait, or navigate with
  `window.next.router.push(path)`.
- Editing a file in `packages/core` or some `packages/ui` files triggers a
  full reload, which resets offers and the like; you stay signed in.
- Check phones at 375 by 812 and laptops at about 1024 wide.
