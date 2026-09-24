# Decisions Log

## Every significant decision, its reasoning, and its status

**Status:** Living document
**Read this if:** you want to know why something is the way it is, or which questions are still open.

---

## How to read this

| Status | Meaning |
| --- | --- |
| ✅ **Decided** | Settled. Build to it. Change it here, with a reason, if it must change. |
| 🟡 **Draft** | Direction agreed, detail still moving. |
| 🔵 **Future** | Specified so it does not block anything. Not being built. |
| ❓ **Open** | Genuinely undecided. Needs a human answer. Blocks something. |

---

## ❓ Open questions — these block real work

| # | Question | Blocks | Notes |
| --- | --- | --- | --- |
| O1 | **Exact relocation date** | How much of the validation test fits while the founder is in Zimbabwe | Three months means dealer-only; six allows the campus programme too |
| O2 | **Who operates Zimbabwe after relocation** | Whether Swap & Top continues at all | A deliverable of the validation test. Candidates: a dealer, a campus ambassador, the existing API collaborator |
| O3 | **Will dealers pay, and for which product** | Whether the rewrite is justified, and whether this is a marketplace or a software business | The primary gate |
| O4 | **First campus confirmed** | The seeding plan only | Assumed to be the University of Zimbabwe. No longer affects verification design, since student verification was removed. |
| O5 | **Is the $2,000 runway or investment capital** | How long the platform can run without revenue | Cannot be both |
| O6 | **Live-update approach for auctions** | Nothing now — deferred with auctions | Database-backed subscription, or a per-auction process. Decide when building |

---

## Business decisions

| # | Decision | Status | Reasoning |
| --- | --- | --- | --- |
| B1 | **Contact-broker model — no money between users** | ✅ | Escrow, refunds, disputes and chargebacks are a different and much larger business. Also means the only money in the system is ours, which simplifies billing enormously. |
| B2 | **Posting is free for everyone** | ✅ | Competitor is free; every listing is inventory and an indexable page. Taxing supply in a marketplace without liquidity is how marketplaces die. |
| B3 | **Dealers are the only payers** | ✅ | Spending power among students is thin. Plan revenue as if ordinary users contribute zero. |
| B4 | **Lead alerts and the dealer console earn first; sponsored slots later** | ✅ | Lead value depends on the quality of one lead. Promotion value depends on traffic volume. |
| B5 | **No consumer subscription tiers** | ✅ | Billing complexity before knowing anyone pays. Recurring billing is also hard on local payment rails. |
| B6 | **No success fees** | ✅ | Uncollectible. As a contact broker we cannot observe whether a sale happened. |
| B7 | **Listing cap is spam control, lifted by free verification** | ✅ | Quality control without taxing catalogue growth. |
| B8 | **Dealers arrive at the same time as users, not afterwards** | ✅ | Almost everyone wants to trade up; only dealers happily trade down. Without them, swap posts go unanswered and users leave. Dealers are liquidity, not just revenue. |
| B9 | **Campus-first, one city, gadgets only** | ✅ | A marketplace needs density, not size. |
| B10 | **Computers lead the product; phones bring volume** | ✅ | More specification dimensions means a wider advantage over title-only search, and higher ticket value. |
| B11 | **Brazil is not a Swap & Top market** | ✅ | Saturated with incumbents, no local network, no capital. Brazil is where the founder lives and serves clients. |
| B12 | **Greta Works Digital is the primary company** | ✅ | It has revenue, it survives the relocation, and it funds everything else. |
| B13 | **The dealer console is the bridge between both companies** | ✅ | A software product with standalone value, sold to the marketplace's supply side. Supportable remotely. |
| B14 | **Keep the entity structure minimal** | ✅ | A full multi-entity holding structure is premature at this revenue. |
| B15 | **Validate before rewriting** | ✅ | The rewrite is the reward for passing, not preparation for trying. |

---

## Product decisions

| # | Decision | Status | Reasoning |
| --- | --- | --- | --- |
| P1 | **No account needed to browse, search or reveal a number** | ✅ | Buyers with no patience are the largest group. A wall on the contact path destroys the positioning. |
| P2 | **Contact behind a recorded, rate-limited button** | ✅ | Three jobs at once: attribution, seller retention, scraper defence. |
| P3 | **One feed with chips, not three destinations** | ✅ | Thin inventory split three ways feels dead. Reversible — the data model is identical. |
| P4 | **Sponsored slots interleaved and labelled, never sorted to the top** | ✅ | Otherwise a handful of dealers own the first screen and the community feel dies. |
| P5 | **Search is a full screen with per-category specification filters** | ✅ | It is the promise, not a feature. |
| P6 | **Four card types, with the swap card as the brand signature** | ✅ | It must be recognisable when screenshotted into WhatsApp. |
| P7 | **One posting flow, three outcomes** | ✅ | A user should not have to classify their own intent before starting. |
| P8 | **Both swap directions supported, with an explicit control** | ✅ | The direction ratio is also a diagnostic for how much dealer capacity is needed. |
| P9 | **Dealer-offers consent, defaulting on** | ✅ | Keeps the student side from feeling like a dealer channel, and makes the lead product defensible. |
| P10 | **Phone number is the identity anchor** | ✅ | Suspension only means something if identity is scarce. SIMs are registered against identity documents locally. |
| P11 | **Verify businesses, not people — no student or occupation verification** | ✅ | **Reversed from an earlier position.** A student badge duplicated phone verification's only structural job; it is an occupation marker rather than a trust signal; it created a data-protection liability by requiring identity documents; and on a platform where strangers meet in person it narrowed a young person's identity publicly, working against the safety it claimed to provide. The platform is nationwide, so a badge reachable by a small fraction of users creates a permanent second class. |
| P20 | **Deal confirmation replaces status-based trust** | ✅ | Both parties confirm a deal went through; the count is public. Earnable by anyone regardless of age, occupation or location. It also gives the platform its only view of settlement, which a contact broker otherwise cannot see, and a far stronger dealer renewal number than reveals alone. |
| P21 | **No ratings or written reviews** | ✅ | Ratings need volume to mean anything and reviews need moderation, invite retaliation and become a dispute surface. A binary confirmed count is robust, cheap and cannot be review-bombed. Revisit at volume. |
| P22 | **Confirmation is not a complaint channel** | ✅ | A "no" means no deal happened, not that anyone behaved badly, and carries no consequence. Complaints go through reporting, which has reasons, review and appeal. A prompt that can punish people is a prompt nobody answers. |
| P23 | **Phone verification is required but not displayed** | ✅ | A badge everyone holds carries no information. |
| P12 | **Auto-approve, take down on report** | ✅ | A human gate is an outage. It also gated nothing in v1 anyway. |
| P13 | **Listings expire after 30 days with a nudge** | ✅ | Stale listings destroy trust and hurt rankings. The nudge doubles as re-engagement. |
| P14 | **Mobile console is primary, desktop second** | ✅ | Shops are run from a phone behind a counter. |
| P15 | **The Friday Drop** | ✅ | Concentrates attention in time, which works at low traffic where a continuous feed does not. Also builds the audience auctions need. |
| P16 | **No user-to-user messaging** | ✅ | An inbox makes us responsible for conversations. Contact-broker means WhatsApp or a phone call. |
| P17 | **Notifications kept deliberately minimal** | ✅ | v1 documented a full messaging system and never built it. Each notification must cause an action. |
| P18 | **Categories: phones, laptops, desktops, consoles, parts, accessories** | ✅ | Gadgets, widened from phones-only for feed variety; not as far as furniture or vehicles. |
| P19 | **Keep the name, broaden the tagline** | ✅ | "Swap & Top" describes one of three things the platform does. Lead with finding and trading. |

---

## Architecture decisions

| # | Decision | Status | Reasoning |
| --- | --- | --- | --- |
| A1 | **The API is the system of record; the web app only renders** | ✅ | Otherwise the future native app can only do a subset of the website, permanently. |
| A2 | **Relational database** | ✅ | Bids need real transactions and database constraints; money wants exact decimals; the domain is genuinely relational. v1 used a document store and modelled relations by hand. |
| A3 | **Managed authentication provider** | ✅ | Removes the subsystem that consumed the most v1 time, and gives native clients working authentication on day one. |
| A4 | **REST with a published machine-readable contract** | ✅ | A TypeScript-only approach gives no usable contract for Swift or Kotlin, trading away the native path. |
| A5 | **Protected by default; ownership checked in the service layer** | ✅ | Makes the v1 class of missing-middleware bugs impossible to introduce by omission. |
| A6 | **Public pages server-rendered; authenticated pages client-rendered** | ✅ | Delivers the whole search-engine benefit without solving authenticated server rendering, which is where v1 bled. |
| A7 | **Readable, immutable slugs; drop the old path prefix** | ✅ | v1 URLs carried a raw identifier and a legacy subpath. |
| A8 | **Keep object storage with no egress charges, direct uploads, local compression** | ✅ | v1's best technical decision. Bandwidth is the dominant variable cost for an image-heavy marketplace. |
| A9 | **Durable database-backed job queue** | ✅ | In-process scheduling loses work on restart and duplicates across instances. Auction close cannot tolerate either. |
| A10 | **Cache revalidation wired to every listing state change** | ✅ | Otherwise sold listings keep ranking and keep appearing. Designed in, not retrofitted. |
| A11 | **Monorepo with shared types and validation** | ✅ | One definition of a listing, used by every client. |
| A12 | **All four listing types defined now; three built** | ✅ | Defining the auction satellite costs an hour; retrofitting the core costs a migration. |
| A13 | **Nothing hard-deleted; state changes instead** | ✅ | Needed for appeals, honest metrics and auction history. |
| A14 | **Explicit currency on every amount** | ✅ | Two currencies circulate, and the local one has been reset repeatedly — most recently to the ZiG in 2024 (code ZWG). |
| A15 | **Idempotent, signature-verified payment callbacks with an append-only log** | ✅ | Providers send duplicates and out-of-order updates. Double-charging a dealer ends the relationship. |
| A16 | **No cold-start hosting tiers** | ✅ | A thirty-second wake-up loses a dealer tapping a lead alert, and later loses an auction's closing minute. |
| A17 | **Retention-capable analytics** | ✅ | Cookieless analytics cannot answer "do people come back", which is one of the four questions being tested. |
| A18 | **Deliberately conventional: no microservices, event bus or search service** | ✅ | The difficulty here is commercial, not technical. Revisit only on measurement. |

---

## Deferred

| # | Item | Status | Revisit when |
| --- | --- | --- | --- |
| D1 | **Auctions** | 🔵 | The Friday Drop has a reliable audience and traffic would produce several bidders per auction |
| D2 | **Native app** | 🔵 | There is inventory and traffic |
| D3 | **Payments between users, escrow** | 🔵 | Only if transaction ownership becomes a deliberate strategy |
| D4 | **Delivery and warehousing** | 🔵 | After a physical presence and staff exist |
| D5 | **The physical swap point** | 🔵 | After an operator is found. The strongest long-term moat — Facebook cannot build physical trust infrastructure. |
| D6 | **Vehicles** | 🔵 | The gadget category is won. The swap-plus-cash mechanic is exactly how cars trade globally. |
| D7 | **Programmatic category and location landing pages** | 🔵 | After validation. Filter state is already in URLs to enable it. |
| D8 | **Price guidance from accumulated listing data** | 🔵 | Needs data volume. People already come online to check prices, so it becomes a reason to visit. |
| D9 | **Regional expansion** | 🔵 | A first campus and a second campus both work |
| D10 | **Recommerce and device financing** | 🔵 | Different businesses requiring capital. Recorded because device financing matches the founding insight exactly. |

---

## Reversed or corrected along the way

Worth recording so the reasoning is not rediscovered.

| Original position | Revised position | Why |
| --- | --- | --- |
| Charge users for extra listings; tiered consumer accounts | Posting free; dealers pay | Charges the scarce side, starves the catalogue, competes with free |
| Students first, dealers later | Both at once | Peer swaps rarely match; dealers are the counterparty |
| Separate Sell and Auction pages | One feed with chips | Thin inventory split three ways feels dead |
| Phones only for the first test | Gadgets — phones, laptops, desktops, consoles, parts | Deal-browsing needs variety; computers are also the stronger search wedge |
| "Less cluttered than Facebook" as the wedge | Demand as a first-class object, specification search, and search-engine presence | A tidier interface does not overcome a network effect |
| Sell as a dealer feature | Sell matters for students too | Cash clears anything; student-to-student sales match easily |
| Launch Swap & Top in Brazil too | Zimbabwe and later the region only | Brazil is saturated; no local network |
| Sort promoted listings to the top | Interleave labelled slots | Five dealers would own the first screen |
| Start the rewrite immediately | Validate on the existing app first | The rewrite is the reward for passing |
| Cookieless page analytics | Retention-capable product analytics | Cannot otherwise measure return visits |
| Verified student badge as the trust signal for private sellers | Confirmed deals, reply time, account age | An occupation marker is not a trust signal; it duplicated phone verification, added a data-protection liability, and narrowed a young person's identity for strangers |
| Reveals as the last observable event | Mutual deal confirmation | Left the platform unable to answer whether any deal ever completed |

---

## Related documentation

- [v1 Lessons](./v1-lessons.md) — the failures behind many of these decisions
- [Roadmap](../product/roadmap.md) — what the decisions add up to
- [Validation Test](../operations/validation-test.md) — where the open questions get answered
- [README](../README.md) — the documentation index

---

**Last Updated:** September 2026
