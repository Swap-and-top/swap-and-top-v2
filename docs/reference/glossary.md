# Glossary

## Shared vocabulary

**Status:** Living document
**Read this if:** you are writing documentation, code or copy and want to use the same words as everyone else.

---

## Core concepts

| Term | Means |
| --- | --- |
| **Listing** | Any post on the platform, of any type. The shared entity that carries owner, photos, location, moderation state and metrics. |
| **Listing type** | One of: sale, swap, request, auction. Determines which detail is attached to the listing. |
| **Item** | A described device. A swap references two items; a request may reference one as a trade-in. |
| **Specification** | A structured, filterable attribute of an item — processor, memory, storage, graphics, battery health, condition. Never free text where a filter depends on it. |
| **Slug** | The readable, immutable URL fragment identifying a listing. Generated from its title and key specifications with a short unique suffix. |

---

## The swap vocabulary

| Term | Means |
| --- | --- |
| **Swap & Top** | The platform's name, and the transaction type where someone trades an item towards another with cash making up the difference. |
| **Top up** | The cash added to a swap. |
| **Trading up** | The poster's item is worth less; they add cash. The large majority of swaps. |
| **Trading down** | The poster's item is worth more; they receive cash. A minority. |
| **Straight swap** | An even trade with no cash. |
| **Trade-in** | The item someone is giving up in a swap, seen from the counterparty's side. |
| **Cash direction** | Which way the money flows: the poster adds, receives, or neither. |

---

## Demand and revenue

| Term | Means |
| --- | --- |
| **Demand** | A statement of what someone wants. Produced by both requests and swaps. |
| **Request** | A listing type: what someone wants, with a budget, and no item of their own to show. |
| **Wanted feed** | The public surface showing demand — requests plus swaps seen as demand. |
| **Lead** | Demand seen from a dealer's side, with the trade-in and cash detail, and a named match against their stock. What dealers pay to be alerted about. |
| **Lead alert** | The paid notification sent to a dealer when matching demand appears. |
| **Match** | A dealer's stock item that satisfies a piece of demand's specification, budget or trade-in value. |
| **Offer** | A structured proposal against demand. Not binding and not escrowed. |
| **Dealer-offers consent** | The per-listing setting controlling whether it may enter dealer lead feeds. Defaults on. |

---

## Contact and measurement

| Term | Means |
| --- | --- |
| **Reveal** | The event recorded when someone taps to see a seller's contact details. **An event, not a UI state.** The platform's most important metric. |
| **Reveal count** | How many reveals a listing has received. What a seller comes back for. |
| **Response rate** | The share of listings receiving at least one reveal or offer within seven days. The clearest measure of whether the marketplace is alive. |
| **Device hash** | A hashed device identifier used for rate limiting. Not an identity. |
| **Slot type** | Whether a listing was organic, sponsored or in a drop at the moment of a reveal. What makes promotion sellable with evidence. |

---

## Promotion

| Term | Means |
| --- | --- |
| **Sponsored slot** | A labelled placement in the feed, roughly every sixth card, rotated among paying dealers. Never a sort to the top. |
| **Drop** / **Friday Drop** | A weekly batch of checked deals published together at a set time and announced to the campus channel. Concentrates attention in time. |
| **Drop slot** | A dealer's paid place in a drop. |
| **Interleaving** | Placing sponsored listings at fixed intervals in the feed rather than sorting them first. |
| **Promotion state** | Whether a listing currently occupies a sponsored or drop slot, and until when. |

---

## People and access

| Term | Means |
| --- | --- |
| **Guest** | Someone with no account. Can browse, search, and reveal contacts. |
| **User** | Any authenticated account. |
| **Dealer** | A user with a shop attached and access to the console. A scope, not a rank. |
| **Shop** | A dealer's public identity and the scope of their console. |
| **Shopfront** | A shop's public, indexable page. |
| **Moderator** | Staff who work the report queue and issue discipline. |
| **Role cascade** | Higher roles include everything below them. A check asks "at least this level", never "exactly this role". |

---

## Verification and trust

| Term | Means |
| --- | --- |
| **Phone verified** | Control of a phone number proven by one-time code. Free and automatic. Required to post. |
| **Verified student** | Student identity checked by staff. Free, because it is an identity anchor, not a product. |
| **Verified dealer** | Business registration checked by staff. Paid, and bundled with the console. |
| **Identity anchor** | The scarce thing an account is tied to. Here, a phone number — because a suspended user must not be able to reappear cheaply. |
| **Account standing** | Good, warned, limited, suspended or banned. Enforced in queries, not filtered in clients. |
| **Swap point** | A future physical counter where two people complete a swap safely and a device is checked. The strongest long-term moat. |

---

## Moderation

| Term | Means |
| --- | --- |
| **Report** | A user's flag against a listing or another user, with a reason. |
| **Report queue** | The prioritised list staff work. |
| **Claim** | A moderator taking a report so two people do not review the same case. |
| **Disciplinary action** | A warning, listing removal, suspension or ban. |
| **Violation matrix** | The mapping from offence type and repetition to a proportionate outcome. Exists for consistency, which is what makes appeals defensible. |
| **Appeal** | A challenge to a disciplinary action, reviewed once. |
| **Report-driven moderation** | Listings publish immediately and are reviewed when reported. The opposite of a pre-approval queue. |

---

## Technical

| Term | Means |
| --- | --- |
| **Protected by default** | Every endpoint requires authentication unless explicitly listed as public. |
| **Public list** | The explicit, short list of endpoints reachable without authentication. |
| **Ownership check** | Verifying in the service layer that the acting user owns the resource. Separate from authentication. |
| **Revalidation** | Clearing cached public pages when a listing changes state. |
| **Durable job** | Background work stored in the database, surviving restart, safe across instances, retried on failure. |
| **Idempotent** | Running twice produces the same result as running once. Required of every job, especially payment reconciliation. |
| **Link preview** | The card a messaging app renders for a shared URL. Requires server-rendered tags, since scrapers do not run JavaScript. |
| **Append-only** | Records that are never updated or deleted — bids, payment callbacks, reveals. |

---

## Companies

| Term | Means |
| --- | --- |
| **Greta Works International** | The intended US holding company. |
| **Greta Works Digital** | The sister company building custom software for small businesses. Has revenue. The primary company. |
| **Swap & Top** | This platform. Not yet a company. |
| **Operator** | The person who runs Zimbabwe operations on the ground. Currently unassigned and an open question. |

---

## Words to avoid

| Avoid | Use instead | Why |
| --- | --- | --- |
| "Post" as a noun | Listing | "Post" was the v1 term and covered only one type |
| "Boost" | Sponsored slot | "Boost" implies sorting to the top, which is explicitly not what happens |
| "Approve" | Publish | There is no approval step |
| "Pending" | Draft | Nothing waits for review before going live |
| "Message" for platform notices | Notification | There is no messaging system |
| "Contact details" in a listing payload | — | They are never there. Only the reveal action serves them. |

---

## Related documentation

- [README](../README.md) — the documentation index
- [Listing Types](../features/listing-types.md) — the core model
- [Decisions Log](./decisions-log.md) — why these concepts are shaped as they are

---

**Last Updated:** September 2026
