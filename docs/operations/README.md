# Operations Documentation

## Running the thing once it exists

This folder covers the work that is not code: proving the business, measuring it, and collecting money.

---

## 📋 Contents

- **[validation-test.md](./validation-test.md)** — the six-week dealer test, with pass and fail criteria. **Read this before planning any build work.**
- **[metrics.md](./metrics.md)** — what gets measured, why, and what good looks like
- **[payments-and-invoicing.md](./payments-and-invoicing.md)** — collecting from dealers, manually first

---

## 🚦 Why this folder comes before the build

The most likely way this project fails is not choosing the wrong architecture. It is building for months before finding out whether anyone will pay.

The v1 history is exactly that pattern: an appeals tribunal, a violation matrix and a four-role hierarchy were built while search, pagination and analytics did not exist, and no analytics of any kind were ever added — so after three years there was no way to know whether anything worked.

[validation-test.md](./validation-test.md) is the correction. It runs on the existing application, costs almost nothing, and produces a yes or a no.

---

## 🎯 The one question

> **Will a dealer, having seen real leads for a month, pay anything at all?**

Everything else in this documentation set is conditional on the answer.

---

## 🔗 Related documentation

- [Roadmap](../product/roadmap.md) — the validation gate in the middle of it
- [Monetization](../business/monetization.md) — what is being sold
- [Go To Market](../business/go-to-market.md) — the full version of the seeding plan
- [Company Structure](../business/company-structure.md) — the relocation deadline this test runs against

---

**Last Updated:** September 2026
