# Swap & Top

Gadget trading marketplace for Zimbabwe. Monorepo: the web app, a shared web UI
library, and a platform-agnostic core that a future mobile app can reuse.

The product specification lives in [`docs/`](./docs). Read
[`docs/00-SUMMARY.md`](./docs/00-SUMMARY.md) first.

---

## Running it

```bash
pnpm install
pnpm dev
```

The web app comes up on <http://localhost:3000>.

```bash
pnpm typecheck   # tsc across every workspace — the current quality gate
pnpm build       # production build
```

Requires Node 20+ and pnpm. If port 3000 is taken, `PORT=3100 pnpm dev`.

---

## Layout

```
swap-and-top-v2/
├── docs/                    the specification — business, product, architecture
├── apps/
│   └── web/                 Next.js App Router, marketplace + dealer console
└── packages/
    ├── core/                types · tokens · mock data · Zustand stores
    ├── ui/                  React components · CSS Modules · icons
    └── assets/              brand marks, images, fonts
```

### What goes where

| Question | Answer |
| --- | --- |
| A type, a store, mock data, a token value | `packages/core` |
| A React component, a stylesheet, an icon | `packages/ui` |
| A binary asset shared across apps | `packages/assets` |
| A screen, a route, a page-specific component | `apps/web` |

**The rule that matters:** `@snt/core` contains no DOM and no CSS. A future
Expo app imports all of it and rebuilds only the views. `@snt/ui` is web-only —
CSS Modules and DOM elements cannot cross to React Native, so anything both
platforms need belongs in core.

---

## Conventions

### Styling

- **Custom CSS and CSS Modules.** No Tailwind, no CSS-in-JS.
- **Every value is a token.** Colours, spacing, radii, type sizes and breakpoints
  live in `packages/ui/src/styles/tokens.css` as custom properties. No component
  hard-codes a colour. `@snt/core/tokens` mirrors the same values as TypeScript
  for a future native app — change one, change the other.
- **Mobile-first, `min-width` only.** There is not a single `max-width` query in
  the codebase. Layouts start at phone width and gain things as the screen grows.
- **One `.module.css` beside each component**, so a change to one screen cannot
  leak into another.

### Breakpoints

| Token | Width | Used for |
| --- | --- | --- |
| `sm` | 480px | large phones |
| `md` | 768px | tablet — the marketplace column widens |
| `lg` | 1024px | **the dealer console gains its sidebar and table** |
| `xl` | 1280px | desktop |

### State

Zustand, one store per concern, all in `packages/core/src/stores`:

| Store | Holds |
| --- | --- |
| `useFeedStore` | category and type filters |
| `useSearchStore` | query and specification filters |
| `useSavedStore` | the watchlist |
| `useRevealStore` | which contacts have been revealed, and the rate limit |
| `usePostDraftStore` | the three-step posting flow |
| `useConsoleStore` | console tabs, selected lead, offer composer |
| `useDealStore` | deal confirmation answers |

Pure helpers sit beside the stores — `filterFeed`, `searchListings`,
`interleaveSponsored` — so the same logic can run on a server component or in a
native app.

### Accessibility

Real `<button>`, `<a>`, `<input>` and `<label>` everywhere, including in mockups.
Touch targets at least 44px. Text contrast at least 4.5:1. Colours that must be
told apart also differ in lightness, not only hue.

---

## Screens

Each route maps to a wireframe artboard. The wireframes are at
<https://claude.ai/artifact/JhU2rAynKjdh3n4CjcnFwz>.

| Route | Artboard | Notes |
| --- | --- | --- |
| `/` | `Main` | One feed, two chip rows |
| `/search` | `Search` | Per-category specification filters, live result count |
| `/wanted` | `Wanted` | Requests and swaps shown as demand |
| `/listing/[slug]` | `DetailDealer`, `DetailSwap` | One route, three views by type |
| `/shop/[slug]` | `Shopfront` | |
| `/post`, `/post/details`, `/post/review` | `PostType`, `PostDetails`, `PostReview` | |
| `/saved` | `Saved` | |
| `/me` | `Me` | |
| `/deals/[id]/confirm` | `DealConfirm` | |
| `/console/stock` | `ConsoleStockM` **and** `ConsoleStockD` | One responsive route |
| `/console/leads` | `ConsoleLeadsM` **and** `ConsoleLeadsD` | One responsive route |
| `/console/promote` | `ConsolePromoteM` | |
| `/reference/cards` | `Cards` | Component reference, not a user screen |

---

## What is real and what is not

**Real:** every screen, every component, the styling system, the routing, and
working local state. Filters filter, saving saves, the post flow advances,
console tabs switch, and Show number reveals.

**Not real:**

- **All data is mock**, in `packages/core/src/mock`. Nothing persists — a refresh
  resets everything.
- **No API, no auth, no database.** See `docs/architecture/` for what those become.
- **Images are grey placeholders.** Real listing photos live in object storage.
- **Phone numbers are obviously fake**, sequential placeholders.

### Two deliberate deviations from the spec

1. **Everything is client-rendered.** `docs/architecture/seo-and-rendering.md`
   requires the public pages — feed, search, listing, shopfront — to be
   server-rendered, because search engines and WhatsApp link previews are the
   acquisition channel. That cannot happen while the data is client-side mock
   state. When the API arrives, those four routes move to server components;
   the page files already have `generateMetadata` in place for it.

2. **The marketplace has no desktop layout.** The wireframes only define phone
   widths, so rather than inventing one the column is centred and capped. The
   place to add a real desktop grid is marked in
   `packages/ui/src/layout/Screen.module.css`. The console *does* have a
   desktop layout, because the wireframes define it.

---

## Things worth knowing before you edit

- **Relative times are pre-formatted strings** (`postedLabel` on a listing), not
  computed. Computing them at render produces one string on the server and
  another in the browser, which React reports as a hydration mismatch. When real
  timestamps arrive, format them behind a client-only boundary.
- **Sponsored listings are interleaved, not sorted to the top.** See
  `interleaveSponsored`. Sorting them first means a handful of paying dealers own
  the entire first screen.
- **A confirmed-deal count of zero renders as nothing**, not as "0 deals". A zero
  reads as a warning; an absence reads as new.
- **There is no student or occupation badge**, and there should never be one.
  `docs/product/trust-and-safety.md` explains why it was removed.
