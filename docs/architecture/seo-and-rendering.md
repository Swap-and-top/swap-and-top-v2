# SEO & Rendering

## The acquisition channel, in technical terms

**Status:** Decided
**Read this if:** you are building the web app. This document explains why the web app is shaped as it is.

---

## Overview

Search engines and link previews are not a marketing afterthought. They are **the acquisition channel** that does not require beating Facebook's network effect. This is the main technical reason v2 is a rewrite rather than a patch.

Two separate problems, often conflated:

| Problem | Who | Urgency |
| --- | --- | --- |
| **Link previews** | WhatsApp, Facebook, X scrapers | **Immediate** — affects every share made today |
| **Search rankings** | Google and others | Slower burning, compounds over time |

---

## Link previews are the urgent one

Search engines do execute JavaScript, so the claim that a browser-rendered app cannot be indexed is outdated. It is queued into a second pass that can lag days to weeks, which matters for fast-churning listings, but it is not fatal.

**Link scrapers do not execute JavaScript at all.** WhatsApp, Facebook and X fetch the HTML, look for preview tags, and render whatever they find.

In v1 the situation was:

- A share feature existed and produced a URL
- The page had one static title, no description, and no preview tags whatsoever
- So a listing pasted into WhatsApp rendered as a bare grey box with no image, no title and no price

For a market where WhatsApp is the dominant distribution channel, **every share a user made was thrown away.** That is a growth problem more than an SEO problem, and it is the single highest-value fix available.

---

## Requirements

### Per-page metadata

Every public page renders its own title, description and preview tags on the server. For a listing:

| Tag content | Source |
| --- | --- |
| Title | Item name plus key specifications plus price |
| Description | Condition, location, and what the seller wants |
| Preview image | The listing's first photograph, as an **absolute** URL |
| Type and dimensions | So the scraper renders a large card rather than a thumbnail |
| Canonical URL | The slug URL |

The absolute image URL is the detail most often got wrong, and it silently breaks the whole preview.

### Readable slugs

```ascii
v1:  /swapandtop/posts/viewpost/68a3f1c9d4e2b7a1f0c85d33
v2:  /listing/thinkpad-t480-i5-16gb-256gb-harare-a3f9
```

The v1 URL contains no information — nothing for a search engine to match against a query, and nothing for a person to recognise in a WhatsApp message. The slug is generated from the title and key specifications with a short unique suffix, and is immutable after publishing so links never break.

The `/swapandtop/` prefix is also removed. It was an artefact of an old subpath deployment and is noise on a real domain.

### Structured product data

Listings emit machine-readable product and offer markup — name, condition, price, currency, availability, images. This is what makes rich results possible for a marketplace and is straightforward to emit server-side.

### Sitemap

Generated, listing every live listing and shopfront, regenerated as listings change state. Expired and sold listings must leave it, or search engines keep sending people to dead pages.

### Robots directives

Public pages indexable. Account pages, console and staff tools excluded.

---

## The rendering split

Driven by one question: does a search engine or a link scraper need to see this?

| Server-rendered | Client-rendered |
| --- | --- |
| Browse feed — first page | Posting flow |
| Search results | Saved listings |
| Listing detail | Account hub |
| Shopfront | Dealer console |
| Category and location pages (later) | Staff tools |

### Why this split is strategically important

**Every server-rendered page needs no authentication.** That is not a coincidence — it is a deliberate choice that keeps the hardest migration problem off the critical path.

Authenticated server-side rendering requires the rendering server to hold the user's session, which is exactly the area where v1 lost the most time. By making the SEO-critical surface entirely public, the whole search-engine benefit ships without solving that problem first. See [auth-and-identity.md](./auth-and-identity.md).

---

## Caching and revalidation

Public pages are cached and served statically. Listings change state constantly, so the cache must be invalidated precisely.

```ascii
Listing changes state
        │
        ▼
 API emits a revalidation signal
        │
        ├──► the listing page
        ├──► the feed
        ├──► affected category pages
        └──► the sitemap
```

**Design this in from the start.** Retrofitting produces the exact failure it prevents — a sold listing still ranked in Google and still shown in the feed, which is the staleness problem the 30-day expiry exists to avoid. Handled as a triggered job; see [background-jobs.md](./background-jobs.md).

---

## Programmatic landing pages — later

A significant future channel for a marketplace: pages built from category and location combinations, such as laptops in a particular suburb or a specific model in a specific city. These rank for the queries people type *before* they know exactly what they want, and they are often a bigger organic channel than individual listings.

They come from the same data as search results, which is why **filter state belongs in the URL** from the first version. A filtered search URL is already a landing page; the later work is choosing which combinations deserve a curated one.

Deferred to after validation. See [../product/roadmap.md](../product/roadmap.md).

---

## Performance targets

Search rankings and user experience pull in the same direction here.

| Target | Reason |
| --- | --- |
| Fast first paint on a mid-range Android over mobile data | The realistic device and connection |
| Minimal layout shift | Images must reserve their space |
| Small initial payload | Data costs the user money |
| Feed images at card size, lazily loaded | The heaviest screen in the product |

Test on a throttled connection, not on office broadband.

---

## Definition of done

- [ ] Every public page renders its own title, description and preview tags server-side
- [ ] Preview images are absolute URLs and render as large cards
- [ ] Listings have readable, immutable slugs; the old path prefix is gone
- [ ] Structured product markup on listing pages
- [ ] Generated sitemap that adds live listings and removes dead ones
- [ ] Robots directives excluding private surfaces
- [ ] Public pages server-rendered with no authentication involved
- [ ] Cache revalidation wired to every listing state change
- [ ] Filter state present in search URLs
- [ ] A shared listing verified to render a correct preview in WhatsApp

That last item is the acceptance test that matters most. Paste a link into WhatsApp and look at it.

---

## Related documentation

- [System Overview](./system-overview.md) — the rendering split in context
- [Auth & Identity](./auth-and-identity.md) — why public pages avoid authentication
- [Background Jobs](./background-jobs.md) — revalidation as a job
- [Media & Images](./media-and-images.md) — the preview image
- [Search & Discovery](../product/search-and-discovery.md) — filter state in URLs
- [The Wedge](../business/the-wedge.md) — why this is the acquisition channel
- [v1 Lessons](../reference/v1-lessons.md) — the preview and URL failures

---

**Last Updated:** September 2026
