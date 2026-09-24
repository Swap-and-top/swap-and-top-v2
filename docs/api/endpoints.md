# API Endpoints

## Every endpoint by area, with purpose, access level and behaviour

**Status:** Draft — the surface is settled, exact paths may shift during build
**Read this if:** you are building or consuming the API.

---

## Access levels

| Level | Meaning |
| --- | --- |
| **Public** | No authentication. Must appear on the public list below. |
| **User** | Any authenticated account |
| **Owner** | Authenticated, and the owner of the resource — checked in the service layer |
| **Dealer** | Authenticated dealer, scoped to their own shop |
| **Moderator** | Moderator or above |
| **Admin** | Admin or above |

Roles cascade. A check asks "at least this level", never "exactly this role".

---

## 🔓 The public list

**These, and only these, are reachable without authentication.** Everything not on this list requires a session.

| Endpoint | Purpose |
| --- | --- |
| Browse listings | The feed |
| Search listings | Specification search |
| Get listing by slug | Listing detail |
| Get shop by slug | Shopfront |
| Reveal contact | Rate-limited by device hash |
| Record a listing view | Fire-and-forget metric |
| Sitemap and metadata | Search engines |
| Health check | Monitoring |
| Start authentication | Sign-in and registration entry |

---

## Authentication

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Request a one-time code | Public | Sends a code to a phone number |
| Verify a one-time code | Public | Exchanges the code for a session |
| Sign in with email and password | Public | Alternative method |
| Social sign-in callback | Public | Provider redirect handling |
| Refresh session | User | Handled by the provider's client library |
| Sign out | User | Ends the session |
| Get current user | User | Profile, role, verification state, standing |

Sessions and refresh are handled by the managed authentication provider. There is no hand-rolled token bootstrap — see [../architecture/auth-and-identity.md](../architecture/auth-and-identity.md).

---

## Listings

### Reading

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Browse listings | Public | Feed. Filters by type, category, location. Cursor-paged. Returns only live listings from accounts in good standing. **Never includes contact details.** |
| Search listings | Public | Specification filters per category, plus a live result count |
| Get listing by slug | Public | Full detail minus contact details |
| Get related listings | Public | Similar items, for the detail page |

### Writing

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Create listing | User | Any type. Publishes straight to live. Requires phone verification. Subject to the soft cap. |
| Update listing | **Owner** | Ownership checked in the service layer |
| Delete listing | **Owner** | Marks withdrawn; never a hard delete |
| Mark sold | **Owner** | Leaves feed, search and sitemap |
| Relist | **Owner** | Re-publishes an expired or sold listing |
| Update price | **Owner** | Triggers price-drop notifications to savers |

Note the access level on every write. In v1 the equivalent update and delete routes had no authentication at all and their services performed no ownership check.

---

## Contact reveals

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Reveal contact | Public, rate-limited | Returns contact details for a listing and records the event |
| Get reveal statistics for own listing | Owner | Counts for the seller's feedback loop |

The reveal endpoint is the only route through which contact details are ever served. It records the listing, a device hash, the viewer's role, the timestamp, and the promotion slot type at the time — that last field is what makes promotion sellable with evidence.

---

## Demand and offers

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Browse demand | Public | The Wanted feed — requests plus swaps shown as demand |
| Create offer | User | Against a swap or request. Not binding, not escrowed. |
| List offers on own listing | Owner | For the requester to review |
| List own offers | User | Offers this user has made |
| Update offer state | Owner or offerer | Accept, decline, withdraw |

---

## Deal confirmation

| Endpoint | Access | Purpose |
| --- | --- | --- |
| List own pending confirmations | User | Prompts awaiting an answer |
| Get confirmation | Party to it | The listing and the counterparty's display name only — never their answer |
| Answer confirmation | Party to it | Yes, no, or not yet. Idempotent per party. |
| Get confirmed deal count | Public | Aggregate only, for a user or a shop. Never per-deal detail. |

A "no" answer is stored and never returned to the other party. Answering carries no disciplinary consequence — complaints go through the reporting endpoints instead. See [../features/deal-confirmation.md](../features/deal-confirmation.md).

## Saved listings

| Endpoint | Access | Purpose |
| --- | --- | --- |
| List saved | User | With availability state and price-drop flags |
| Save listing | User | |
| Remove saved listing | Owner of the saved entry | |

---

## Users and verification

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Get own profile | User | |
| Update own profile | Owner | |
| List own listings | User | Including drafts |
| Delete own account | Owner | Soft delete with a retention window |
| Submit verification | User | Student or dealer, with supporting evidence |
| Get verification state | User | |
| Update notification preferences | Owner | Per category and channel |

Administrative user listing and role changes are under [Administration](#administration).

---

## Shops and dealers

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Get shop by slug | Public | Shopfront with trust statistics and stock grid |
| Get own shop | Dealer | |
| Update own shop | Dealer | Name, logo, description, location, hours |
| List own stock | Dealer | With status, views and reveals per item |
| Bulk import stock | Dealer | The fastest way to onboard a dealer |
| List leads | Dealer | Matching demand, with trade-in detail and named stock matches |
| List reveals received | Dealer | |
| Get performance | Dealer | Reveals over time, confirmed deals, sponsored versus organic |

---

## Promotion and billing

| Endpoint | Access | Purpose |
| --- | --- | --- |
| List promotion products | Dealer | Lead alerts, sponsored slots, drop slots, with prices |
| Get own subscription state | Dealer | |
| Purchase promotion | Dealer | Creates a payment in a pending state |
| Payment provider callback | Public, signature-verified | **Idempotent.** Advances the payment state machine. |
| List own payments | Dealer | |
| Get invoice | Dealer | |
| Apply for a drop slot | Dealer | |

The callback endpoint is public because the provider calls it, but it verifies a signature and is idempotent on the provider's reference. Providers send duplicates and out-of-order updates, and double-charging a dealer in a trust-based marketplace is fatal. See [../operations/payments-and-invoicing.md](../operations/payments-and-invoicing.md).

---

## Moderation

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Create report | User | Against a listing or a user, with a reason |
| List report queue | Moderator | Prioritised by severity and age |
| Claim report | Moderator | Prevents duplicate work; claims expire when idle |
| Resolve report | Moderator | With an outcome and a reason |
| Remove listing | Moderator | With a reason; notifies the owner; appealable |
| Issue disciplinary action | Moderator | Warning, suspension or ban, per the violation matrix |
| List own disciplinary actions | User | Transparency for the affected user |
| Submit appeal | User | Once per action |
| List appeal queue | Moderator | |
| Resolve appeal | Moderator | Upheld or overturned, with a reason |

In v1 the endpoint that issued a disciplinary action had no authentication, so any anonymous caller could discipline any user. Note the access level here.

---

## Administration

| Endpoint | Access | Purpose |
| --- | --- | --- |
| List users | Admin | With filters and standing |
| Update user role | Admin | |
| Update user standing | Admin | |
| Review verification submissions | Admin | Approve or reject |
| Platform statistics | Admin | Listings, users, reveals, revenue |
| List all payments | Admin | |
| Mark payment received | Admin | **Manual collection during validation** |
| Set promotion flag | Admin | Manual promotion during validation |
| Manage drop | Admin | Curate and schedule the weekly drop |

The last three exist specifically so that revenue and promotion can be tested by hand before any payment integration is built.

---

## Notifications

| Endpoint | Access | Purpose |
| --- | --- | --- |
| List own notifications | User | With unread state |
| Mark read | Owner | |
| Mark all read | Owner | |

There is no user-to-user messaging endpoint. Users contact each other on WhatsApp or by phone; the platform brokers the introduction and stops there. See [../features/notifications.md](../features/notifications.md).

---

## Media

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Request an upload target | User | Returns a destination for a direct upload |
| Confirm upload | User | Associates the stored path with a listing |

Image bytes never pass through the API. See [../architecture/media-and-images.md](../architecture/media-and-images.md).

---

## Metadata and monitoring

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Health check | Public | Monitoring |
| Sitemap data | Public | Live listings and shopfronts |
| Categories and specification schema | Public | Drives the posting form and the filter sets |

That last one is worth noting: the category specification schema is served rather than duplicated in each client, so the web app, the console and the future mobile app cannot disagree about what fields a laptop has.

---

## Future — auctions

Specified so the contract can accommodate them. Not built. See [../features/auctions.md](../features/auctions.md).

| Endpoint | Access | Purpose |
| --- | --- | --- |
| Create auction | User | With a paid listing fee |
| Place bid | User | **Account required.** Transactional; must exceed the current high bid. |
| List bids | Public | Append-only history |
| Subscribe to auction updates | Public | Live price changes |
| Close auction | System | Scheduled, durable, idempotent |

---

## Related documentation

- [API Design Rules](./README.md) — the conventions above
- [Auth & Identity](../architecture/auth-and-identity.md) — access levels and enforcement
- [Data Model](../architecture/data-model.md) — the entities
- [Features](../features/) — the behaviour each area serves
- [v1 Lessons](../reference/v1-lessons.md) — the specific endpoint failures referenced here

---

**Last Updated:** September 2026
