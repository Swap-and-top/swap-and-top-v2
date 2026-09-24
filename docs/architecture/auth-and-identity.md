# Auth & Identity

## Accounts, phone-anchored identity, roles, and server-side rendering

**Status:** Decided
**Read this if:** you are building authentication, permissions, or server-rendered pages. This was the largest source of pain in v1.

---

## Overview

Three separate concerns, often confused:

| Concern | Question |
| --- | --- |
| **Authentication** | Who is this? |
| **Identity scarcity** | Can they cheaply become someone else? |
| **Authorisation** | What may they do? |

v1 hand-rolled all three and lost a great deal of time to the first. v2 uses a managed provider for authentication, anchors identity to a phone number, and makes authorisation cascade properly.

---

## Decision 1 — do not write authentication again

v1 implemented email and password, verification codes, password reset, and two social sign-in providers by hand. That subsystem produced a long run of commits fighting the same problem — token initialisation races, forced timeouts in route guards, mobile-specific workarounds. The scar tissue is visible in the history.

**v2 uses a managed authentication provider.** It supplies:

- Phone number with one-time code — **the primary method**
- Email and password
- Social sign-in
- Session and refresh handling
- First-party client libraries for web and for native platforms

**What this buys beyond saved time:** when the native app arrives, authentication already works on a third platform without re-solving refresh tokens for a third time.

---

## Decision 2 — phone number is the identity anchor

Not email.

### The problem with email

A suspended user registers again with a fresh address in thirty seconds. Discipline becomes theatre, and the entire moderation system is decoration.

### Why a phone number works here

- SIM cards are registered against identity documents locally, so numbers are scarce
- Essentially everyone uses WhatsApp, so numbers are universal
- Evading a ban costs real money and effort rather than thirty seconds

### Consequences

- Phone verification by one-time code is required to post anything
- It is the key that raises the soft listing cap
- It is the foundation for auction bidding later, where accountability is the whole integrity model
- Email becomes optional, used for receipts, invoices and moderation records

See [../product/trust-and-safety.md](../product/trust-and-safety.md).

---

## Decision 3 — roles cascade

```ascii
SUPER ADMIN  ⊃  ADMIN  ⊃  MODERATOR  ⊃  USER  ⊃  GUEST
                                    
DEALER = USER + shop scope (an added surface, not a rank)
```

A role check must ask **"does this user have at least this level?"** — never **"is this user exactly this role?"**

### The v1 failure this replaces

The role check was an exact string comparison. A super admin was therefore refused on every route restricted to admin — the platform owner could load the admin dashboard and then be denied by the API behind it. Separately, one route applied a role restriction with no authentication check in front of it, so it crashed on a missing user rather than refusing cleanly. And one role referenced in a restriction did not exist in the set of valid roles at all, meaning that endpoint could never succeed for anyone.

All three are the same underlying mistake: authorisation treated as a string comparison rather than as a modelled hierarchy.

### Dealer is a scope, not a rank

A dealer is an ordinary user with a shop attached and an extra surface. They can swap, save and request as themselves. Dealer permissions are scoped to their own shop — never a general elevation.

---

## Decision 4 — protected by default

> Every endpoint requires authentication unless it appears on an explicit public list.

### The v1 failure this replaces

Several routes registered update and delete handlers without the authentication middleware, and the corresponding service functions performed no ownership check. The result: **any unauthenticated caller could edit or delete any listing**, and could issue a disciplinary action against a user. Not a subtle bug — a forgotten middleware on a handful of routes.

Inverting the default makes that class of bug impossible to introduce by omission. Forgetting to mark something public produces a harmless failure; forgetting to protect something is no longer possible.

### The public list

Everything else requires a session.

| Public | Why |
| --- | --- |
| Browse feed | Guests must browse |
| Search | Guests must search |
| Listing detail | Guests must view |
| Shopfront | Guests must view, and it must be indexable |
| Contact reveal | Rate-limited, but genuinely public — this is [../product/principles.md](../product/principles.md) rule 1 |
| Sitemap and metadata | Search engines |

### Ownership is checked in the service layer

Not only at the route. A service function that mutates a listing takes the acting user and refuses to act on someone else's. Route-level checks protect against unauthenticated access; service-level checks protect against authenticated access to the wrong resource. Both are needed.

---

## Decision 5 — keep authenticated server-side rendering off the critical path

This is the migration hazard that most deserves attention.

### The problem

Server-side rendering means the server makes requests on behalf of the user during rendering. That requires the server to hold the user's session. In v1 the access token lived in a module-level variable in the browser and the refresh token in a cookie scoped to the API — neither of which exists on a rendering server.

Solving this properly means either a cookie domain shared between the web app and the API, or the web app proxying authentication and issuing its own session cookie. Both are doable; both are fiddly; and this is precisely the area where v1 already bled.

### The decision

**The pages that need search-engine visibility need no authentication at all.**

| Server-rendered | Authentication |
| --- | --- |
| Feed, search, listing detail, shopfront | None |

| Client-rendered | Authentication |
| --- | --- |
| Posting, saved, account, console, staff tools | Session in the browser, as in v1 |

This delivers the entire search-engine and link-preview benefit without solving authenticated server rendering on day one. Solve it later, deliberately, when nothing depends on it.

A small amount of personalisation on public pages — a saved-state marker, for instance — is applied after load rather than during rendering.

---

## Session handling

- Managed by the authentication provider
- Refresh handled by its client library rather than by hand
- **No token initialisation race**, because there is no hand-rolled bootstrap. This alone removes the single most persistent v1 problem.
- Route guards read a resolved session state, never a "maybe a token is coming" state

The v1 pattern of scattered timeouts in route guards, waiting to see whether a token would materialise, must not reappear. If a guard needs a timeout, the session model is wrong.

---

## Verification, separate from authentication

Authentication proves control of a phone number. Verification asserts something further.

| Tier | Method | Cost | Unlocks |
| --- | --- | --- | --- |
| Phone verified | One-time code | Free, automatic | Posting; raises the listing cap. **Not displayed.** |
| Verified dealer | Business registration reviewed by staff | Paid | Shopfront, badge, console |

**Verify businesses, not people.** There is no student or occupation tier. A private seller's trustworthiness is shown through behaviour — confirmed deals, reply time, account age, clean record — not through a status badge. The reasoning, including the data-protection and personal-safety arguments, is in [../product/trust-and-safety.md](../product/trust-and-safety.md).

Phone verification is required but never shown, because a badge everyone holds carries no information.

---

## Rate limiting

| Action | Basis |
| --- | --- |
| Contact reveal | Device hash, generous for guests, higher when signed in, unlimited for paying dealers |
| Posting | Per account, per day |
| Reporting | Per account, per day |
| Authentication attempts | Per number and per address |

Device-hash rate limiting is why reveals can stay open to guests at all. See [../product/contact-and-reveals.md](../product/contact-and-reveals.md).

---

## Definition of done

- [ ] Phone and one-time code as the primary authentication method
- [ ] Managed provider handling sessions and refresh, with no hand-rolled bootstrap
- [ ] Role checks asking "at least this level", verified for super admin on every restricted route
- [ ] Every endpoint protected unless on the explicit public list
- [ ] Ownership checks inside service functions, not only at routes
- [ ] Public pages server-rendered with no authentication involved
- [ ] No timeouts anywhere in route guards
- [ ] Verification tiers separate from authentication
- [ ] Rate limits on reveals, posting, reporting and authentication

---

## Related documentation

- [System Overview](./system-overview.md) — protected-by-default as a structural rule
- [Data Model](./data-model.md) — the user entity
- [Moderation](../features/moderation.md) — the role hierarchy in use
- [Trust & Safety](../product/trust-and-safety.md) — why identity must be scarce
- [SEO & Rendering](./seo-and-rendering.md) — the rendering split
- [v1 Lessons](../reference/v1-lessons.md) — all four failures above, with specifics

---

**Last Updated:** September 2026
