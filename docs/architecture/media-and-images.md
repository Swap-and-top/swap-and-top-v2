# Media & Images

## Upload path, storage, and data cost

**Status:** Decided — v1's approach was correct and carries over
**Read this if:** you are building uploads or optimising the feed.

---

## Overview

An image-heavy marketplace in a market where mobile data is expensive. Two goals, in tension: listings need enough photographs to be trustworthy, and pages need to be light enough that people will load them.

The v1 architecture here was **the single best technical decision in the project** and carries over unchanged: images go to object storage with no egress charges, uploaded directly from the browser through a small edge handler, never through the API.

---

## The upload path

```ascii
Browser
   │
   │ 1. compress locally
   ▼
Compressed image
   │
   │ 2. direct upload
   ▼
Edge upload handler ──► Object storage
   │                      (organised by user and listing)
   │ 3. returns stored path
   ▼
Browser
   │
   │ 4. path saved with the listing
   ▼
API ──► Database
```

### Why uploads bypass the API

- Large binary payloads never touch the application service
- No temporary files on an application server
- Upload load scales independently of the rest of the system
- The API stores a reference and nothing more

### Why local compression before upload matters

The person uploading is on mobile data and paying for it. Compressing in the browser reduces their cost as well as ours, and it is the difference between a seller finishing a listing with six photographs and abandoning it after two.

---

## Storage organisation

Predictable paths, grouped so that a user's or a listing's media can be found and removed together.

```ascii
bucket/
├── users/<user>/profile/<file>
└── listings/<year>/<month>/<user>/<listing>/
                    ├── owned/<file>
                    └── wanted/<file>
```

The owned and wanted separation matters for swaps, where the two sides of the listing hold different images and the wanted side usually holds none.

---

## Why object storage with no egress charges

For an image-heavy marketplace, bandwidth is the dominant variable cost. Storage is cheap almost everywhere; **serving** is what gets expensive.

A provider that charges nothing for egress turns the largest variable cost into a fixed one. At the point where the platform succeeds and the feed is being scrolled heavily, this decision is worth more than every other cost optimisation combined.

**Do not change this.** It is already right.

---

## Serving

| Requirement | Reason |
| --- | --- |
| Multiple sizes per image | A card thumbnail must not be a full-resolution photograph |
| Modern formats where supported | Substantially smaller for the same quality |
| Lazy loading below the fold | The feed must not fetch twenty images to show three |
| Stable URLs | Images are referenced from cached pages and from link previews |
| Publicly readable | Listings are public; there is no benefit to signed URLs here |

### Sizes needed

| Size | Used for |
| --- | --- |
| Thumbnail | Compact cards, saved lists, console stock rows |
| Card | Feed cards |
| Detail | Listing detail carousel |
| Preview | Link previews for WhatsApp and search engines — must be an absolute URL |

That last one is easy to forget and breaks sharing when it is wrong. A link preview image must be absolute, publicly reachable, and of reasonable dimensions.

---

## Limits

| Limit | Value | Reason |
| --- | --- | --- |
| Images per listing | 2 minimum, 8 maximum | Two is enough to be credible; eight is enough for any gadget |
| Images for a request | None | The poster does not own the thing |
| Maximum file size | A few megabytes after compression | Anything larger is a mistake, not a photograph |
| Accepted formats | Common photographic formats | |

---

## Data cost discipline

The feed is the heaviest screen in the product and the one people spend most time on.

- Serve the card size to cards, never the detail size
- Lazy load everything below the fold
- Do not preload the detail carousel from the feed
- Keep the feed response small — a card needs a handful of fields, not a full listing
- Test on a throttled connection, not on office broadband

---

## Profile and shop images

Same pipeline, different path. Profile images are optional and have a neutral default. Shop logos are part of dealer identity and appear on every dealer card, so they are worth requiring during dealer onboarding.

Where a profile image comes from a social sign-in provider, it is copied into our own storage rather than linked — external image URLs expire.

---

## Lifecycle

- Images belong to a listing and share its fate
- A removed or expired listing's images are retained while the listing record is retained, since nothing is hard-deleted
- Orphaned uploads — a draft abandoned before publishing — are swept periodically by a background job. See [background-jobs.md](./background-jobs.md).

---

## Definition of done

- [ ] Local compression before upload
- [ ] Direct upload to object storage, bypassing the API
- [ ] Predictable path organisation by user and listing, with owned and wanted separated
- [ ] Multiple sizes generated, including an absolute preview image for link sharing
- [ ] Lazy loading in the feed
- [ ] 2–8 image limits enforced, requests exempt
- [ ] Orphaned upload sweep
- [ ] Feed verified on a throttled mobile connection

---

## Related documentation

- [System Overview](./system-overview.md) — where storage sits
- [SEO & Rendering](./seo-and-rendering.md) — the preview image requirement
- [Feed & Filters](../features/feed-and-filters.md) — feed weight
- [Post Flow](../product/post-flow.md) — image capture in the posting flow
- [Deployment & Hosting](./deployment-and-hosting.md) — cost implications

---

**Last Updated:** September 2026
