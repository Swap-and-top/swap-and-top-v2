# Company Structure

## The holding company, the sister company, and the operator gap

**Status:** Draft — structure intended, not fully registered
**Read this if:** you need to know how Swap & Top relates to the other companies, or who is accountable for what.

---

## Overview

Swap & Top is not a standalone venture. It is one of several intended operating companies under a holding company, and its priority relative to the others is deliberate.

```ascii
INTENDED STRUCTURE:
┌──────────────────────────────────────────────────────┐
│         GRETA WORKS INTERNATIONAL (US)               │
│         holding company                              │
│         receives international payments,             │
│         contracts with clients                       │
└───────────────┬──────────────────┬───────────────────┘
                │                  │
    ┌───────────▼────────┐   ┌────▼─────────────────┐
    │ GRETA WORKS DIGITAL│   │   SWAP & TOP         │
    │ (registered, Zim)  │   │   (not yet a company)│
    │                    │   │                      │
    │ Custom software    │   │ Gadget marketplace   │
    │ for SMEs           │   │ Zimbabwe             │
    │ HAS REVENUE        │   │ NO REVENUE           │
    └────────────────────┘   └──────────────────────┘
                │
                │  (future)
    ┌───────────▼────────────────┐
    │ REAL ESTATE ARM            │
    │ commercial land, rentals   │
    │ family business gives      │
    │ domain access              │
    └────────────────────────────┘
```

---

## The entities

| Entity | Status | Role |
| --- | --- | --- |
| **Greta Works International** (US) | To register when needed | Holding company. Receives international payments, contracts with clients. One partner is US-resident. |
| **Greta Works Digital** (Zimbabwe) | Registered and trading | Custom software for small businesses. Two delivered client projects, one of them paying. **This is the revenue engine.** |
| **Swap & Top** | Not a company — a product under test | Becomes its own company only if validation passes *and* a local operator is found. |
| **Real estate arm** | Future | Commercial land and rentals. Capital-intensive. Family business already operates in this space. |

---

## Priority: Greta Works Digital is primary

Not a demotion of Swap & Top, a sequencing decision. The reasoning:

| Factor | Greta Works Digital | Swap & Top |
| --- | --- | --- |
| Revenue today | Yes | None |
| Survives the relocation | Yes — client work is location-independent | No — a hyperlocal marketplace needs local presence |
| Path to hiring people | Agencies hire years before pre-revenue products | Not yet |
| Funds the other | Yes | No |

With roughly $2,000 of capital and no outside funding, the services business **is** the funding mechanism. That is bootstrapping, not freelancing.

**The distinction that matters:** the problem with freelancing is not that it is services, it is that it does not compound. Services compound when the offering is narrowed, productised, made repeatable, and eventually delivered by someone other than the founder. A reusable SME retail and inventory system — which is what the dealer console is — is the first productised offering.

---

## The bridge between the two companies

> **The dealer console is a Greta Works Digital product sold to Swap & Top's supply side.**

This is the strategic centre of the whole plan:

- It is **recurring B2B revenue** with standalone value, worth paying for even if the marketplace never reaches liquidity.
- It is **supportable remotely**, which survives the relocation.
- It **inverts the marketplace cold-start problem** — dealer stock is already in the system, so publishing it to the marketplace is one action.
- It is the **same product shape** as the ecommerce and inventory system already built for a bookstore client, sold into a different vertical.

The most likely good outcome of validation is that dealers pay for **software** before they pay for **leads**. That outcome is better than it looks.

See [../product/dealer-console.md](../product/dealer-console.md).

---

## Entity structure: keep it minimal

A US entity for receiving international payments and contracting with clients is genuinely useful now, mostly for Greta Works Digital.

A full multi-entity holding structure with subsidiaries in three countries is **premature**. It costs real money and administrative attention that a company with $2,000 does not have. Add an entity when revenue in that jurisdiction demands one.

On the acquisition-holdco ambition: buying companies requires cash flow, and cash flow comes from an operating business. The ten-year frame is fine. The near-term action is making one thing produce reliable cash.

---

## ⚠️ The operator gap

**The single largest structural risk to Swap & Top.**

The founder is relocating to Brazil within roughly three to six months. The partners are financial investors, not operators. Swap & Top's only real advantage is local presence in Harare — campus tables, shop visits, curating the weekly drop, checking devices.

**A hyperlocal marketplace cannot be seeded in Harare from São Paulo.**

Consequences:

1. The validation test must run **before** relocation, compressed to fit.
2. Recruiting a Zimbabwe operator is an explicit deliverable of that test, not an afterthought. Likely candidates: one of the sharper dealers, a strong campus ambassador, or the existing API collaborator.
3. If no operator is found, the honest options are to keep the platform running minimally or to shelve it. Running it remotely is not one of them.

---

## Brazil is not a Swap & Top market

The original plan was to launch Swap & Top in both Zimbabwe and Brazil. These are not comparable opportunities.

| | Zimbabwe | Brazil |
| --- | --- | --- |
| Competition | Facebook Marketplace, WhatsApp groups | Large established classifieds and marketplace incumbents, plus specialised trade-in players |
| Founder's network | Deep | None |
| Language | Fluent | Not |
| Capital required to enter | Low | High |

Brazil is excellent for the founder — cost base, client access, timezone overlap with the US — and excellent for **Greta Works Digital**. It is not a second home for Swap & Top.

Revised position: **Brazil is where the founder lives and serves clients. Zimbabwe, and later the region, is where Swap & Top operates.**

---

## Capital

Roughly **$2,000** available, pooled with partners.

Enough for: the validation test — campus table, ambassador airtime, dealer incentives, hosting for a year.

Not enough for: a marketplace land grab, paid acquisition, inventory, or anything resembling recommerce or financing.

One structural note, not investment advice: this sum is either operating runway or investment capital. It cannot be both, and the decision should be explicit.

---

## Accountability, today

| Function | Who |
| --- | --- |
| Product, engineering, design | Founder |
| Dealer sales and campus seeding | Founder — **needs a successor before relocation** |
| API work (historical) | Second contributor |
| Capital | Founder plus two partners, financial only |
| Zimbabwe operations after relocation | **Unassigned — open question** |

---

## Related documentation

- [Go To Market](./go-to-market.md) — the ground work that needs an operator
- [Monetization](./monetization.md) — what the dealer console sells
- [Dealer Console](../product/dealer-console.md) — the product that bridges both companies
- [Validation Test](../operations/validation-test.md) — the pre-relocation test and its deliverables
- [Roadmap](../product/roadmap.md) — what happens after a pass

---

**Last Updated:** September 2026
