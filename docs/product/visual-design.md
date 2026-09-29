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
| `--snt-ink-muted` | `#8E8E8E` | Condition, meta, ages, counts |
| `--snt-shop-mark` | `#2B2B2B` | A shop's initials mark |

The gradient runs **left to right across the full viewport**, not across the content column: `linear-gradient(90deg, #255DAB, #1CB67F)`.

**The accent is brand blue.** Links, selected states, the verified badge and the deal count all use it. **The action is brand green.** Primary buttons use it. Confirmed deals and live status are green as well.

**The dealer console keeps its dark chrome** (`--snt-dark`). Only its accent changes, from clay to brand blue, because it reads the same tokens.

---

## 🔤 Type

One face, Poppins, self-hosted at five weights. The PDF uses four sizes and nothing else on the feed:

| Size | Weight | Used for |
| --- | --- | --- |
| 15px | Bold | Card title, price |
| 15px | SemiBold | Button label, swap cash amount |
| 13px | Regular | Spec line, swap tile item name |
| 12px | Bold / Regular | Chips (selected / not), "Post New Item" |
| 12px | ExtraBold / Regular | Type tabs (active / not) |
| 10px | Bold | WANTED label, seller and shop names |
| 10px | ExtraBold | "Has", "Looking for" |
| 10px | Regular | Everything else: meta, condition, trust line, stock |

ExtraBold (800) was added for the active tab and the tile labels.

---

## 📐 Layout

| Measurement | Desktop (from the PDF) | Phone |
| --- | --- | --- |
| Content column | 672px, centred | Full width minus 16px gutters |
| Header | Full-bleed gradient, 203px on the feed | Same parts, scaled down |
| Header's bottom-right corner | 40px sweep | 28px sweep |
| Logo row | 36px tall — logo, yellow pill, white circle | Same |
| Search | 40px white pill | Same |
| Chips | 30px pills, 1px white outline, spread across the column | Scroll sideways |
| Type tabs | Equal widths, 3px white underline on the header's edge | Same |
| Card radius | 18px | 18px |
| Card padding | 25px | 16px |
| Gap between cards | 24px | 16px |
| Dealer photo | 168px | 150px |
| Private photo | 142px | 128px |
| Swap tile photo | 163px | 108px |

**The header carries navigation on desktop.** The logo goes home, "Post New Item" opens the posting flow and the white circle opens Me. The bottom navigation bar is phone-only; from 768px up it is hidden, as the design shows no bar.

---

## 🧱 Parts

### Headers

Every marketplace screen starts with the gradient.

- **App header** — Browse, Wanted, Saved, Me. Logo row, then whatever the screen puts under it: the search pill, the chip row, the type tabs, a title. Chips, tabs, titles and search fields restyle themselves automatically when they sit inside it.
- **Screen header** — detail screens. A shorter gradient bar with a white back button, title and actions.
- **Step header** — the posting flow. A screen header with a white progress bar.

### Cards

See [card-system.md](./card-system.md) for what each card means. Visually they share one shape: a `#F2F2F2` box with 18px corners and no border.

- **Wanted** — green WANTED label, bold title, grey budget line, green "I have this" pill
- **Dealer sale** — photo, price and condition, spec line, a thin rule, then the shop row: black initials square, bold name, blue tick "Verified Seller", "4 in Stock" at the far right
- **Private sale** — photo, price and condition, spec line, then one trust line: bold first name, blue tick deal count, area and age
- **Swap** — two rounded tiles, blue "Has" with the cash, green "Looking for", then the poster's trust line

### Trust signals

Both are a **white tick in a blue disc** followed by blue words — "Verified Seller" or "3 deals". They are told apart by the words, never by colour.

### Buttons

Pill-shaped everywhere. Primary is brand green with white type; secondary is white with a light outline.

---

## ✅ Checking a screen against the design

1. Compare the feed at 1366px wide against the PDF. Positions should agree within a few pixels.
2. Anything not in the PDF should use only the tokens above — no new colours, no new radii.
3. At 375px wide, nothing should overflow sideways except the chip row, which scrolls on purpose.

---

## Related documentation

- [Card System](./card-system.md) — what each card communicates
- [Information Architecture](./information-architecture.md) — navigation on phone and desktop
- [Principles](./principles.md) — the rules the look serves

---

**Last Updated:** September 2026
