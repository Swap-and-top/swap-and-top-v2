# Visual Design

## The v2 look: brand gradient, grey cards, blue and green

**Status:** Decided
**Read this if:** you are styling any screen, or checking a screen against the design.

---

## Overview

The source of truth is **`Swap & Top v2 Design.pdf`**: one page, the Browse feed at desktop width. Every value on that page is carried into the code as a design token. Screens the PDF does not draw use the same tokens and the same parts, so the whole app reads as one system.

The colours come from the v1 app — the blue-to-green gradient, the yellow call to action, the logo. Everything else — layout, type sizes, card shapes, spacing — comes from the PDF.

```ascii
THE FEED, AS DRAWN:
┌──────────────────────────────────────────────────────────────────────╮
│ ░░ brand gradient, blue → green, full width ░░░░░░░░░░░░░░░░░░░░░░░ │
│      [logo] Swap & Top                    ( Post New Item )  ( ● )   │
│      ( 🔍 Search phone, laptops, consoles, parts, accessories    )   │
│      (All) (Phones) (Laptops) (Desktops) (Consoles) (Parts) (Acc.)   │
│      All Types        Swaps        For Sale        Wanted            │
│      ▔▔▔▔▔▔▔▔▔                                                     ╭╯
└─────────────────────────────────────────────────────────────── swept ┘
       ┌────────────────────────────────────────────┐
       │ WANTED                               1h ago │   grey card
       │ RTX 3060 or Better                          │
       │ Budget up to $260 · Harare                  │
       │ ( I have this )  4 responses  Blessing T.   │
       └────────────────────────────────────────────┘
       ┌────────────────────────────────────────────┐
       │              grey photo slot               │   dealer sale
       ├────────────────────────────────────────────┤
       │ $265 Used Good                             │
       │ Lenovo ThinkPad 480 · Core i5 · 16GB RAM … │
       │ ────────────────────────────────────────── │
       │ [KC] Kopje Computers ✔ Verified Seller  4 in Stock
       └────────────────────────────────────────────┘
       ┌────────────────────────────────────────────┐
       │ ┌──────────────────┐  ┌──────────────────┐ │   swap
       │ │      photo       │  │      photo       │ │
       │ ├──────────────────┤  ├──────────────────┤ │
       │ │Has         +$240 │  │Looking for       │ │
       │ │Macbook Air 2017  │  │Any Core i7       │ │
       │ └── brand blue ────┘  └── brand green ───┘ │
       │ Tarisai M. ✔ 3 deals  Mt Pleasant · 5h ago │
       └────────────────────────────────────────────┘
```

---

## 🎨 Colour

| Token | Value | Where |
| --- | --- | --- |
| `--snt-brand-blue` | `#255DAB` | Gradient start, swap "Has" tile, verified and deal-count ticks |
| `--snt-brand-green` | `#1CB67F` | Gradient end, swap "Looking for" tile, primary button, WANTED label |
| `--snt-brand-yellow` | `#FFFF8B` | "Post New Item" — green type on yellow |
| `--snt-brand-teal` | `#2572A2` | Type on the selected white chip in the header |
| `--snt-bg-app` | `#FFFFFF` | Page |
| `--snt-bg-card` | `#F2F2F2` | Every card and panel |
| `--snt-bg-placeholder` | `#CECECE` | Photo slots |
| `--snt-ink` | `#434846` | Titles, prices, spec lines, names |
| `--snt-ink-muted` | `#6B6B6B` | Condition, meta, ages, counts, specs under a name. Darkened from the PDF's `#8E8E8E` for readability |
| `--snt-owned-ink` | `#255DAB` | The **name** of something owned or for sale |
| `--snt-wanted-ink` | `#12875C` | The **name** of something wanted, and the WANTED label — a shade deeper than brand green so it reads as text |
| `--snt-shop-mark` | `#2B2B2B` | A shop's initials mark |

The gradient runs **left to right across the full viewport**, not across the content column: `linear-gradient(90deg, #255DAB, #1CB67F)`.

**Blue means owned, green means wanted.** The swap card's blue "Has" tile and green "Looking for" tile set the rule, and the rest of the app follows it quietly: the name of an item — never its specs — is blue when someone has it and green when someone wants it. Cards themselves stay plain grey; there are no coloured stripes or outlines.

**The accent is brand blue.** Links and selected states use it. **The action is brand green.** Primary buttons and live status use it. **Trust is the regular blue** (`#2572a2`) — the verified badge, the deal count and confirmed-deal figures, tick disc and words alike.

**The dealer console keeps its dark chrome** (`--snt-dark`). Only its accent changes, from clay to brand blue, because it reads the same tokens.

---

## 🔤 Type

One face, Poppins, self-hosted at five weights. Sizes start from the PDF, with the smallest text raised from 10px to 11px and the price from 15px to 17px for readability:

| Size | Weight | Used for |
| --- | --- | --- |
| 17px | Bold | Price and swap cash — fixed-width digits so prices line up |
| 15px | Bold | Item names on feed cards — green on a Wanted card, blue on a sale card, on its own line |
| 15px | SemiBold | Button label |
| 13px | Medium | Swap tile item name |
| 12px | Regular | Specs under a name (grey), search placeholder |
| 12px | Bold / Regular | Chips (selected / not), "Post New Item" |
| 12px | ExtraBold / Regular | Type tabs (active / not) |
| 11px | Bold | WANTED label, seller and shop names |
| 11px | ExtraBold | "Has", "Looking for" |
| 11px | Regular | Everything else: meta, condition, trust line, stock |

ExtraBold (800) was added for the active tab and the tile labels.

---

## 📐 Layout

| Measurement | Desktop (from the PDF) | Phone |
| --- | --- | --- |
| Content column | 672px, centred | Full width minus 16px gutters |
| Header | Full-bleed gradient, the logo row only (78px) | The logo row only (60px) |
| Header's bottom-right corner | 40px sweep | 28px sweep |
| Logo row | 36px tall — logo, yellow pill, white circle | Same |
| Search | 40px white pill | Same |
| Chips | 30px pills, 1px white outline, spread across the column | Scroll sideways |
| Type tabs | Equal widths, on white under the header. One underline in the active label's dark ink slides to the active tab (240ms); the thin rule under the row spans the content column, like the cards | Same |
| Category chips | Outlined white with grey labels; the selected one filled in the same dark ink as the active tab, with white type — never blue, which means for sale | Same |
| Card radius | 18px | 18px |
| Radius of boxes inside a card (swap tiles, inputs, trade-in strip) | 12px | 12px |
| Card padding | 24px | 16px |
| Spacing inside a card | 4px grid: 4 within a group, 12 between groups | Same |
| Gap between cards | 24px | 16px |
| Sale photo (dealer and private alike) | 5 : 2 of the card width | 5 : 2 |
| Swap tile photo | 163px | 108px |
| Primary button height | 40px | 44px |

These refine the PDF's own values (25–27px padding, fixed 168/142px photos, a dark divider) into one consistent set.

**The header carries navigation on desktop.** The logo goes home, "Post New Item" opens the posting flow and the white circle opens Me. The bottom navigation bar is phone-only; from 768px up it is hidden, as the design shows no bar.

**On a phone the feed's type tabs stay pinned** at the top while scrolling, so switching between All Types, Swaps, For Sale and Wanted never needs a scroll back up.

---

## 🧱 Parts

### Headers

Every marketplace screen starts with the gradient.

- **App header** — Browse, Wanted, Wishlist, Me. The gradient holds only the logo row — logo, Post New Item, account — the same height on every screen. Whatever the screen adds — the search pill (filled grey), the chip row, the type tabs, a title — sits on white directly beneath it. Chips, tabs, titles and search fields have a white-on-gradient style too, used only if one is ever placed on the gradient.
- **Screen header** — detail screens. A shorter gradient bar with a white back button, title and actions.
- **Step header** — the posting flow. A screen header with a white progress bar.

### Cards

See [card-system.md](./card-system.md) for what each card means. Visually they share one shape: a `#F2F2F2` box with 18px corners and no border.

- **Wanted** — green WANTED label, bold green title, grey budget line, and the requester's trust line (bold first name, blue tick deal count) on the left; the green "I have this" pill on the right, centred against the text. The response count sits top right with the age — "4 responses · 1h ago" A trade-in strip, when there is one, runs full width underneath, with a small photo of the trade-in at its left (a count in its corner when there are several) that opens the photo viewer. What someone wants is never pictured; what they offer can be.
- **Dealer sale** — photo; the item name in blue with its specs in grey beneath on the left, price over condition on the right — after a price drop, the old price struck through in small grey beside it; a light rule, then the shop row: black initials square, bold name, blue tick "Verified Seller", and at the far right "4 in Stock" above the save and share icons. On a phone the name and badge stack
- **Private sale** — photo; name and specs on the left, price and condition on the right; then one trust line: bold first name, blue tick deal count, area and age
- **Swap** — two solid rounded tiles, blue "Has" and green "Looking for", with the cash on the side that comes with it — "Has" when the poster adds, "Looking for" when you do. Then the poster's trust line. Wanted cards and the swap detail also say who pays in words — "They add $240", "You add $60" or "Straight swap" — from one helper (`swapTerms`); "they" is always the poster and "you" whoever takes the swap. A request with something to swap is worded the same way: its budget is cash the poster adds on top, capped rather than fixed, so it reads "They add up to $600", with "+ up to $600" on the Has strip. The "Looking for" photo slot is grey with the category's icon in green: what someone wants is described, never pictured

Sale and swap cards carry **save and share** icons — the v1 app's star and share glyphs — at the far right of their bottom row; Wanted cards carry them in their bottom row beside the requester. Saving fills the star in the same grey — never blue, which means for sale; sharing opens the phone's share sheet (so WhatsApp), or copies the link where there is none. The rest of the card is one link to the listing.

**Photos** swipe sideways, one at a time, on sale cards, on the "Has" tile of a swap, and at the top of a listing. Dots over the bottom edge show which photo is up (the current one stretches into a short bar) and jump to a photo when tapped; with a mouse, arrows appear on hover. A tap on a photo opens it full screen — whole, not cropped, over the page blurred under a light tint that matches the card (v1's blue for an individual's post, the same in green for a Wanted post, no tint for a shop's), with the same swipe, dots and arrows, a "2 / 4" counter and a close button (Escape and the arrow keys work too); a tap anywhere else on the card opens the listing.

**Every card is white**, on the sky-blue page (`#ebf2ff`), whoever posted it — dealer, individual or Wanted. A box set into a card, like the "Has" strip on a Wanted card, takes the page colour so it still shows. Who posted a listing is read from its content: a shop row and verified badge for a dealer, a name and deal count for an individual.

Every tappable card gives a little when pressed; it does not change colour under the pointer. Keyboard focus shows a blue ring — white on the gradient.

### Trust signals

Both are a **white tick in a blue disc** followed by words in the same blue — "Verified Seller" or "3 deals". They are told apart by the words, never by colour.

### Buttons

Pill-shaped everywhere. Primary is brand green with white type; secondary is white with a light outline. Primary buttons are 44px tall on a phone for an easy thumb target, 40px from tablet up.

---

## ✅ Checking a screen against the design

1. Compare the feed at 1366px wide against the PDF. The layout should match; the refinements above account for the differences in size and spacing.
2. Anything not in the PDF should use only the tokens above — no new colours, no new radii.
3. At 375px wide, nothing should overflow sideways except the chip row, which scrolls on purpose.

---

## Related documentation

- [Card System](./card-system.md) — what each card communicates
- [Information Architecture](./information-architecture.md) — navigation on phone and desktop
- [Principles](./principles.md) — the rules the look serves

---

**Last Updated:** September 2026
