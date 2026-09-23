# Deployment & Hosting

## Environments, cost, and operational limits

**Status:** Decided
**Read this if:** you are setting up infrastructure or working out what this costs to run.

---

## Overview

The platform must run for very little money, because there is roughly $2,000 of capital and no outside funding. Low running cost is also a genuine strategic advantage: **a project with almost no burn cannot run out of money, only out of founder attention.**

Traffic is not the constraint and will not be for years. A city-sized marketplace is well within the free or near-free tier of most modern hosting. The constraints that actually bite are elsewhere.

---

## Target cost

| Component | Monthly |
| --- | --- |
| Web and API hosting | ~$5 |
| Database and authentication | $0 on a free tier, rising to ~$25 when outgrown |
| Object storage and bandwidth | ~$0–1, because egress is not charged |
| Email | $0 on a free tier |
| Analytics | $0 on a free tier |
| **Total** | **~$5 to start, ~$30 at real traffic** |

At that level the platform can run for a year on a small fraction of available capital, which buys patience.

---

## The constraint that actually matters: no cold starts

**Avoid any hosting tier that spins down when idle.**

A platform that takes thirty seconds to wake up loses the user. It is worse than that in two specific cases:

- A dealer tapping a lead alert, where the whole product is speed
- Later, the closing minute of an auction

Free tiers that sleep are false economy. Paying a few dollars a month for a runtime that is always warm is the correct trade, and it is the main reason not to take the cheapest possible option.

---

## Environments

| Environment | Purpose | Data |
| --- | --- | --- |
| **Local** | Development | Seeded sample data |
| **Staging** | Pre-release verification | Its own database, never production data |
| **Production** | Live | |

Configuration per environment. Secrets never committed — v1 got this right and it carries over.

### A note on v1's configuration debris

v1's environment files still carried database credentials for a relational database alongside the document database connection string, left over from an abandoned migration. The dependency list similarly held several unused database libraries, four email libraries, and a routing library that has no business in a backend.

The lesson is small but worth writing down: **remove configuration and dependencies when the thing they served is gone.** They are confusing later and they look like hidden requirements to anyone new.

---

## Deployment

- Deploy from the main branch on merge
- Staging deploys from a staging branch
- Database changes applied as versioned migrations, run as part of deployment
- Rollback by redeploying the previous version

### Branch hygiene

Worth stating because v1 suffered from it. The v1 front end had a main branch thirty-two commits behind the working branch, and the API had seven local branches with unclear relationships. That is a real hazard when starting new work — it is possible to build against the wrong baseline for days before noticing.

**One trunk. Short-lived branches. Merge or delete.**

---

## Monitoring

Minimal but real. The failure mode to avoid is a platform quietly stopping without anyone noticing.

| What | Why |
| --- | --- |
| Uptime check on the public feed and the API | The most basic signal |
| Error reporting with alerts | Unhandled failures surfaced, not buried |
| Job queue depth and failure count | A silently growing queue means something is broken |
| Report queue depth | Moderation backlog |
| Analytics with returning-visitor analysis | Required for the validation test |

**Logging:** structured, with levels, written to somewhere queryable. v1 added this late and it was the right call — keep it from the start. Note also that v1 had roughly 130 console statements across both repositories; use the logger, not the console.

---

## Backups

- Automated daily database backups, retained for a reasonable window
- Object storage is durable by default; no separate image backup needed
- **A restore must be tested at least once.** An untested backup is a hope, not a backup.

---

## Domain

A proper brand domain, with the marketplace at the root and the API on a subdomain.

v1's production origin list included a numeric domain on an unusual top-level domain, which suggests it never launched under a real brand. Choose the real domain before any launch activity — every share, every printed card and every search result depends on it.

**Cookie domain note:** if authenticated server-side rendering is added later, the web app and the API need to share a parent domain for cookies to work across both. Arranging the domains that way now costs nothing and avoids a migration later. See [auth-and-identity.md](./auth-and-identity.md).

---

## The abandoned v1 deployment pipeline

Worth recording as a caution. v1 had a continuous deployment workflow that:

- Triggered on pushes to a branch that did not exist in the repository
- Deployed to a hosting product that was no longer the actual target
- Used a runtime version and action versions several years out of date

It therefore never ran, and anyone reading the repository would reasonably assume deployment was automated. **A pipeline that does not run is worse than no pipeline**, because it misleads.

---

## Scaling, when it matters

Not now, but the order in which things would be addressed:

1. **Database connection limits** before database size
2. **Image bandwidth** — already solved by the egress-free storage choice
3. **Search query performance** — indexing first, a search service only if measurement demands it
4. **Cache revalidation volume** — batching invalidation if listing churn grows

None of these are worth engineering for in advance. The correct response to each is measurement first.

---

## Definition of done

- [ ] Local, staging and production environments with separate databases
- [ ] Always-warm runtime for web and API, no cold starts
- [ ] Deployment on merge, with versioned migrations
- [ ] Rollback by redeploy, verified once
- [ ] Uptime checks, error alerting, queue depth visibility
- [ ] Structured logging, no console output in production paths
- [ ] Daily backups with a tested restore
- [ ] Real brand domain, API on a subdomain sharing a parent
- [ ] No unused dependencies or dead configuration
- [ ] One trunk, no long-lived divergent branches

---

## Related documentation

- [System Overview](./system-overview.md) — what is being deployed
- [Media & Images](./media-and-images.md) — the egress cost decision
- [Background Jobs](./background-jobs.md) — queue observability
- [Auth & Identity](./auth-and-identity.md) — the cookie domain consideration
- [v1 Lessons](../reference/v1-lessons.md) — the dead pipeline, branch drift and dependency debris

---

**Last Updated:** September 2026
