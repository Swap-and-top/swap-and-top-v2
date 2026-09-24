# Product Principles

## The non-negotiable rules every screen obeys

**Status:** Decided
**Read this if:** you are about to design, build or change anything. This is the shortest document in the set and the one that settles the most arguments.

---

## Overview

Nine rules. Each one exists because of a specific commercial reason or a specific v1 failure. When a feature request conflicts with one of these, the rule wins unless the rule is explicitly changed here.

---

## 1. 🚪 No wall between a buyer and a seller's number

A guest can browse, search, filter, open any listing, and reveal a seller's phone number without an account.

**Why:** buyers with no patience are the largest group, and the entire positioning is "find gadgets easily." A sign-up wall on the contact path destroys the product's reason to exist.

**The only permitted friction:** a per-device rate limit on reveals, to stop bulk scraping. It must not be visible to a normal user.

**This is the rule most likely to be eroded** by reasonable-sounding requests to capture leads or grow the user base. Refuse them.

---

## 2. 🔍 Search is the product, not a feature

The promise is "find gadgets easily." Specification-aware search is that promise. It is the thing a dealer will judge in four seconds and the thing Facebook cannot do.

**Consequence:** search quality outranks every other piece of polish. It is never the thing that slips.

**v1 failure this prevents:** the search box existed but its submit handler did nothing, the backend filter targeted the wrong field, and the processor specification was silently discarded on save. The platform's headline advantage was entirely absent.

---

## 3. 📱 One feed, not three destinations

Sale listings, swap posts and requests live in **one stream**, filtered by chips. Not separate pages or tabs.

**Why:** thin inventory divided three ways produces three dead-looking feeds. One mixed feed feels alive. Mixing also creates discovery — someone browsing swaps sees a dealer's sale.

**Reversible:** the data model is identical either way. If volume ever justifies dedicated pages, promoting a chip to a page is a presentation change.

---

## 4. 💸 Free where it grows the catalogue, paid where it grows results

Posting is free. Browsing is free. Contact is free. Dealers pay for leads, tooling, and visibility.

**Why:** the competitor is free, every listing is inventory and an indexable page, and taxing supply in a marketplace with no liquidity is how marketplaces die.

**Corollary:** listing caps exist for spam control and are lifted by free verification, never by payment.

---

## 5. 🏷️ Sponsored is labelled and interleaved, never sorted to the top

Promoted listings appear in clearly marked slots at fixed intervals — roughly every sixth card — rotated among payers.

**Why:** sorting promoted listings first means a handful of paying dealers own the entire first screen, the feed stops feeling like a community, and the student side of the platform dies. Labelled interleaving also keeps trust intact, and the slot price scales naturally with traffic.

---

## 6. 📊 If it is not counted, it did not happen

Contact reveals, listing views, response rates and return visits are counted from the first day the platform is live.

**Why:** the reveal event is simultaneously the seller's reason to come back (*"your listing got 47 contacts"*), the evidence that lets us charge for promotion, and the measurement that decides whether the business is real.

**v1 failure this prevents:** zero analytics of any kind, after three years of building. There was no way to know whether anything worked.

---

## 7. 📶 Assume a cheap Android on mobile data

Light pages, compressed images, lazy loading, small payloads, one-thumb reach, touch targets at least 44 pixels.

**Why:** the market is mobile-first and data is expensive. A heavy app loses users here faster than a plain one.

---

## 8. 🔗 Every listing must share properly

A listing pasted into WhatsApp shows a photo, a title and a price. Always.

**Why:** WhatsApp is the primary distribution channel. Link scrapers do not run JavaScript.

**v1 failure this prevents:** a share feature existed and produced dead grey links with no preview, throwing away every share a user made.

---

## 9. 🛡️ Protected by default, ownership checked in the service layer

Every endpoint requires authentication unless it is explicitly listed as public. Authorisation is checked where the work happens, not only at the route.

**Why:** in v1, listings could be edited and deleted by unauthenticated callers because a middleware was forgotten on some routes. Inverting the default makes that class of bug impossible to introduce by omission.

---

## Design language

Not rules so much as settled direction.

| Aspect | Decision |
| --- | --- |
| Layout | Mobile-first at 390px, one-thumb reach, bottom navigation |
| Feed density | Large image, bold price, minimal chrome — scannable at speed |
| Signature element | The swap card's have-⇄-wants split with the cash amount between. This is the brand. |
| Trust cues | Verified dealer, confirmed deals, member since, reply time — visible wherever a decision is made. Behaviour, never status or occupation. |
| Tone | Plain and transactional. This is a business tool, not a social feed. |
| Never | Fake status bars, emoji as interface elements, gradient decoration |

---

## Accessibility baseline

- Real buttons, links, inputs and labels — never a clickable non-interactive element
- Text contrast at least 4.5:1, or 3:1 above 24px
- Colours that must be distinguished also differ in lightness, not hue alone
- Icon-only controls carry an accessible label

---

## What to do when a rule blocks something valuable

Change the rule here, in this document, with the reason recorded in [../reference/decisions-log.md](../reference/decisions-log.md). Do not route around it in one screen — that is how a product loses its shape.

---

## Related documentation

- [The Wedge](../business/the-wedge.md) — the commercial reasoning behind rules 1–5
- [v1 Lessons](../reference/v1-lessons.md) — the verified failures behind rules 2, 6, 8 and 9
- [Card System](./card-system.md) — rule 5 in visual detail
- [Contact & Reveals](./contact-and-reveals.md) — rules 1 and 6 in behavioural detail
- [Search & Discovery](./search-and-discovery.md) — rule 2 in full

---

**Last Updated:** September 2026
