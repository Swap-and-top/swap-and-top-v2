# Post Flow

## One posting flow with three outcomes

**Status:** Decided
**Read this if:** you are building the posting experience or deciding what data gets captured.

---

## Overview

One entry point, one flow, three possible results. A user should never have to work out which kind of thing they are making before they start.

```ascii
POSTING FLOW:
                    ┌─────────────┐
                    │  POST  (+)  │
                    └──────┬──────┘
                           ▼
              ┌────────────────────────┐
              │  Step 1: what do you   │
              │  want to do?           │
              └───┬────────┬───────┬───┘
                  │        │       │
        ┌─────────▼──┐ ┌───▼────┐ ┌▼──────────────┐
        │   SELL     │ │ SWAP & │ │  LOOKING FOR  │
        │ something  │ │  TOP   │ │  something    │
        └─────┬──────┘ └───┬────┘ └───┬───────────┘
              │            │          │
              └────────────┼──────────┘
                           ▼
              ┌────────────────────────┐
              │  Step 2: details       │
              │  (fields vary by type) │
              └───────────┬────────────┘
                           ▼
              ┌────────────────────────┐
              │  Step 3: review        │
              │  card preview, contact │
              └───────────┬────────────┘
                           ▼
                      LIVE IMMEDIATELY
```

Wireframe frames: `PostType`, `PostDetails`, `PostReview`.

---

## Step 1 — choose the outcome

Three options, each with a one-line explanation of what happens next.

| Option | Explanation shown to the user | Produces |
| --- | --- | --- |
| **Sell something** | Set a price. Buyers call or message you directly. | A sale listing |
| **Swap & top** | Trade what you have towards what you want, adding or receiving cash. | A swap listing |
| **Looking for something** | Say what you want and your budget. Dealers come to you. | A request |

**Swap & top is visually emphasised** — accent border, tinted background, a small "our thing" marker. It is the platform's distinctive feature and the option most likely to be new to the user.

The screen also states plainly that **posting is free** and the listing **goes live straight away**. Both reduce hesitation.

A quiet note at the bottom points high-volume sellers toward a dealer account.

---

## Step 2 — details

Fields depend on the type and the category. Common structure:

### All types

- **Category** — phones, laptops, desktops, consoles, parts, accessories
- **Location** — area within the city
- **Photos** — 2 to 8 required, except for requests which need none

### Sale

- Item name, specifications for the category, condition, defects, accessories
- **Price**

### Swap & top

- **What you have**: item name, specifications, condition, defects, accessories, photos
- **What you want**: item name or description, plus any specifications that matter — no photos, since they do not own it
- **The cash**: direction and amount

### Request

- What you want, in plain words plus any specifications that matter
- **Budget**
- Optionally, a trade-in — which turns the request into swap demand

---

## The cash direction control

The single most important control in the swap flow, and the one most easily made confusing.

```ascii
┌──────────────────────────────────────────────────┐
│  THE CASH                                        │
│  [ I add cash ]  [ They add cash ]  [ Straight ] │
│                                                   │
│  How much will you add?                          │
│  [ $240                                       ]  │
└──────────────────────────────────────────────────┘
```

Three states:

| State | Meaning | Who this is |
| --- | --- | --- |
| **I add cash** | Trading up — my device is worth less, I make up the difference | The large majority |
| **They add cash** | Trading down — I want money back with the swap | The minority, usually people who need cash |
| **Straight swap** | Even trade, no money | Uncommon |

The amount field's label changes with the state, so the user never has to work out the direction from context. The ratio between "I add" and "they add" across all listings is a metric worth watching — see [../features/swap-and-top.md](../features/swap-and-top.md).

---

## Step 3 — review

Three jobs on this screen.

### 1. Show the card exactly as it will appear

A live preview of the real feed card. This is not decoration — it is how the user checks their own work, and it teaches them what a good listing looks like.

### 2. Contact preferences

Which channels the poster accepts: WhatsApp, phone call, SMS. At least one required.

Plus a separate toggle, below a divider:

> **Let dealers send me offers**

Default on. This gives the user explicit control over whether dealers may approach them, which protects the experience from feeling like a dealer channel. See [../features/wanted-and-leads.md](../features/wanted-and-leads.md).

The screen states plainly: **your number is hidden until someone taps Show number, and you will see how many people did.** That sentence does two jobs — it reassures, and it introduces the metric the seller will come back for.

### 3. What happens next

Stated in one short passage:

- Goes live immediately
- Listings that break the rules are taken down when reported
- Expires in 30 days

No approval queue, no waiting. See [../features/moderation.md](../features/moderation.md).

---

## Specification capture rules

The posting flow is where search quality is decided. Non-negotiable:

- **Structured fields for anything filterable.** Free text cannot be filtered reliably.
- **Suggestions from known values**, with an escape for unusual entries.
- **Every field shown must be stored.** If a field is collected and not persisted, remove the field. In v1 the processor was collected, passed along, and dropped by the schema.
- **Normalise on save** so equivalent values filter together.
- **Never require a specification that most sellers will not know.** Battery health is optional; processor is required for laptops.

---

## Image handling

- 2 to 8 photos for anything the poster owns
- Compressed client-side before upload — data is expensive
- First photo becomes the card image and the link-preview image
- Uploaded directly to object storage, not through the API
- Requests need no photos at all

See [../architecture/media-and-images.md](../architecture/media-and-images.md).

---

## Draft behaviour

A partially completed post is kept as a draft so an interrupted user does not lose work. Drafts are visible in the dealer console's stock list with a `DRAFT` badge and on the user's own listings.

---

## Friction budget

Posting must stay short enough that a student standing on a campus lawn will finish it.

| Type | Target steps | Target time |
| --- | --- | --- |
| Request | 1 screen | under 30 seconds |
| Sale | 3 screens | under 2 minutes |
| Swap | 3 screens | under 3 minutes |

If a field cannot be justified against that budget, it is optional or it goes.

---

## Related documentation

- [Card System](./card-system.md) — what the preview shows
- [Search & Discovery](./search-and-discovery.md) — why specification capture matters
- [Contact & Reveals](./contact-and-reveals.md) — the contact preference model
- [Listing Types](../features/listing-types.md) — what each outcome produces in data
- [Swap & Top](../features/swap-and-top.md) — the swap-specific rules
- [Moderation](../features/moderation.md) — why there is no approval queue

---

**Last Updated:** September 2026
