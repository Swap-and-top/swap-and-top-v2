# Product Documentation

## How the platform behaves and looks, independent of technology

This folder describes what gets built and why, at the level of screens, flows and rules. It should be readable by someone who does not write code, and complete enough that an engineer never has to guess at intent.

---

## 📋 Contents

### Foundations

- **[principles.md](./principles.md)** — the non-negotiable rules every screen obeys. Read this first.
- **[information-architecture.md](./information-architecture.md)** — surfaces, navigation and the full screen inventory
- **[roadmap.md](./roadmap.md)** — order of work, and what is deliberately deferred

### The core experience

- **[card-system.md](./card-system.md)** — the four listing cards and what makes each one recognisable
- **[search-and-discovery.md](./search-and-discovery.md)** — specification-aware search, the platform's main advantage
- **[post-flow.md](./post-flow.md)** — one posting flow with three outcomes
- **[contact-and-reveals.md](./contact-and-reveals.md)** — how people reach each other, and the metric it produces

### Business-facing and protective

- **[dealer-console.md](./dealer-console.md)** — the surface dealers pay for
- **[trust-and-safety.md](./trust-and-safety.md)** — verification, stolen devices, safe meeting, discipline

---

## 🖼️ Wireframes

Every screen described here exists as an interactive mobile-first wireframe:

**https://claude.ai/artifact/JhU2rAynKjdh3n4CjcnFwz**

Frame names in [information-architecture.md](./information-architecture.md) match the canvas exactly.

---

## 🎯 Quick reference — the product in one diagram

```ascii
TWO SURFACES, ONE API:

 ┌──────────────────────────────┐   ┌──────────────────────────────┐
 │       MARKETPLACE            │   │      DEALER CONSOLE          │
 │       mobile, scrollable     │   │      mobile first, desktop   │
 │                              │   │      for bulk work           │
 │  Browse  Wanted  Post        │   │  Stock  Leads  Promote  Shop │
 │  Saved   Me                  │   │                              │
 │                              │   │                              │
 │  Guests, students,           │   │  Dealers                     │
 │  private sellers             │   │  (the ones who pay)          │
 └──────────────┬───────────────┘   └───────────────┬──────────────┘
                │                                  │
                └──────────────┬───────────────────┘
                               ▼
                      ONE REST API
              (also serves the future mobile app)
```

---

## 🧭 The central product idea

A swap post is a **structured statement of demand with a trade-in attached**. It is simultaneously:

- the feature that makes the platform distinctive to ordinary users
- the lead that dealers pay to be told about

Everything in this folder follows from that. If a design decision weakens either side of it, the decision is wrong.

---

## 🔗 Related documentation

- [The Wedge](../business/the-wedge.md) — why these choices beat the competition
- [Features](../features/) — behaviour specifications per feature
- [Architecture](../architecture/) — how it gets built
- [v1 Lessons](../reference/v1-lessons.md) — the failures these rules exist to prevent

---

**Last Updated:** September 2026
