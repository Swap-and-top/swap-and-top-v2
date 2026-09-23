# v1 Lessons

## Every verified failure in the first version, and the rule each one produced

**Status:** Verified against the v1 source in September 2026
**Read this if:** you are writing code or a build plan. This is the most useful document in the set.

---

## Overview

The first version was built over roughly three years, from June 2023, by someone learning to code while building it. Around 900 commits across two repositories. That was a reasonable trade — it produced a capable developer and two shipped client projects — but it left specific defects, and they are worth recording precisely.

**These are not guesses.** Each item below was verified by reading the v1 source. File and line references are to the v1 repositories.

---

## 🚨 Group 1 — Live security holes

Present in the deployed application. These are the reason [../operations/validation-test.md](../operations/validation-test.md) starts with security fixes.

| Failure | Detail | Rule it produced |
| --- | --- | --- |
| **Unauthenticated writes** | `PUT` and `DELETE` on posts, items, reports and appeals registered handlers with no authentication middleware, and the services performed no ownership check. Any anonymous caller could edit or delete any listing. | **Protected by default.** Every endpoint requires authentication unless explicitly listed as public. See [../architecture/auth-and-identity.md](../architecture/auth-and-identity.md). |
| **Unauthenticated discipline** | `POST /disciplinaryAction/action` had no authentication. Anyone could issue a disciplinary action against any user. | Same rule. Also: ownership and authority checked in the service layer, not only at the route. |
| **Contact details in public responses** | The public listing endpoint populated every seller's email address and phone number into an unauthenticated response. The whole seller base was scrapable without signing in. | **Contact details are served only by a dedicated, recorded, rate-limited reveal action.** See [../product/contact-and-reveals.md](../product/contact-and-reveals.md). |

---

## 🔍 Group 2 — The product's headline feature did not exist

The most striking finding. The positioning was "find gadgets easily", and finding was the one thing that did not work.

| Failure | Detail | Rule it produced |
| --- | --- | --- |
| **Search did nothing** | The submit handler in both search components consisted of `preventDefault` and a console log. The search box was a shell. | **Search is the product, not a feature.** It is never the thing that slips. |
| **Backend search targeted the wrong field** | The filter built a set of owned-item identifiers and then matched them against the post's *wanted* item reference. The two sets are disjoint, so it would have returned nothing even if it had been called. | Specification filters have an acceptance test: a real query returning correct results. |
| **A key specification was discarded on save** | The processor field was collected in the form and passed to the data layer, but was commented out of the schema — so it was silently dropped, and any filter on it matched nothing. | **Every field the form collects must be stored.** If it is not stored, remove it from the form. See [../architecture/data-model.md](../architecture/data-model.md). |
| **The feed stopped at ten items** | The client requested one page with no parameters; the API defaulted to a page size of ten; and no pagination or infinite scroll existed anywhere. The feed could never show an eleventh listing. | **Infinite scroll with stable cursor paging** is foundational, not polish. |
| **No slugs** | Listing URLs contained a raw database identifier. Nothing for a search engine to match, nothing a person could recognise. | **Readable, immutable slugs.** See [../architecture/seo-and-rendering.md](../architecture/seo-and-rendering.md). |

---

## 📡 Group 3 — Nothing was measurable, and nothing was shareable

| Failure | Detail | Rule it produced |
| --- | --- | --- |
| **No analytics at all** | No analytics library, tag or script anywhere, after three years. There was no way to know whether anything worked. | **If it is not counted, it did not happen.** Instrumentation ships with the feature. See [../operations/metrics.md](../operations/metrics.md). |
| **No link previews** | A share feature produced a URL. The page had one static title, no description, and no preview tags. Shared into WhatsApp it rendered as a blank grey box. | **Every listing must share properly.** The acceptance test is pasting a link into WhatsApp and looking at it. |
| **No sitemap, no robots file** | Neither existed. | Generated sitemap, robots directives, structured product markup. |
| **The promotion field did nothing** | A promotion flag existed on the listing and was stored, but the feed sorted by creation date only. Nothing read it. | Promotion is interleaved and labelled in the feed. See [../features/feed-and-filters.md](../features/feed-and-filters.md). |

---

## 🛡️ Group 4 — Authorisation modelled as string comparison

| Failure | Detail | Rule it produced |
| --- | --- | --- |
| **Roles did not cascade** | The role check was an exact string comparison. A super admin was therefore refused on every route restricted to admin — the platform owner could load the dashboard and be denied by the API behind it. | **Role checks ask "at least this level".** Verified for super admin on every restricted route. |
| **A role restriction with no authentication in front of it** | One route applied a role check before any authentication ran, so it failed on a missing user rather than refusing cleanly. | Authentication always precedes authorisation. Enforced by the protected-by-default default. |
| **A restriction naming a role that does not exist** | One endpoint restricted access to a role absent from the set of valid roles, so it could never succeed for anyone. | Roles are a closed set, defined once, and referenced from that definition. |
| **Route shadowing** | Single-segment parameterised routes were registered before literal routes at the same depth, so several administrative endpoints were unreachable — the literal path was matched as an identifier. | **Literal routes before parameterised ones.** See [../api/README.md](../api/README.md). |
| **Moderation gated nothing** | Listings defaulted to a pending state, but the public feed filtered only on deletion and sold flags and never checked moderation state. Everything was visible regardless of review. | Feed, search and sitemap read only live listings from accounts in good standing, filtered in the query. See [../features/moderation.md](../features/moderation.md). |

---

## 🧹 Group 5 — Codebase debris

Not defects exactly, but they cost time and mislead readers.

| Finding | Detail | Rule it produced |
| --- | --- | --- |
| **Thirteen "copy" files in the source tree** | And at least one was live — a route imported a controller function from a file named as a copy. So they could not be safely deleted without checking each one. | No parallel copies in the source tree. Version control is the history. |
| **Four email libraries installed** | Four different email packages in the dependency list. | One provider, one library. See [../architecture/system-overview.md](../architecture/system-overview.md). |
| **Unused database libraries** | Three relational database libraries installed alongside the document database that was actually used, plus a frontend routing library in the backend. | Remove dependencies when the thing they served is gone. |
| **Dead payment code** | The payment service called a relational query method on document-database models, with a hardcoded email address and phone number. It would have thrown on first call, and its route was commented out. | Dead code is deleted, not commented out. |
| **Stale environment configuration** | Environment files still carried relational database credentials alongside the document database connection string, left from an abandoned migration. | Remove configuration when its subject is gone. It looks like a hidden requirement. |
| **Repetition in the server setup** | The static uploads directory was mounted four times; the TLS certificate was read twice, once into an unused variable. | Reviewable startup configuration. |
| **Around 130 console statements** | Roughly 80 in the frontend and 54 in the API. | Use the logger. See [../architecture/deployment-and-hosting.md](../architecture/deployment-and-hosting.md). |
| **Four state management libraries** | Four different client state libraries in one frontend, one of them holding a single slice. | One data-fetching approach, one client state approach. |

---

## 🏗️ Group 6 — Infrastructure that misled

| Failure | Detail | Rule it produced |
| --- | --- | --- |
| **A deployment pipeline that never ran** | It triggered on pushes to a branch that did not exist in the repository, deployed to a hosting product that was no longer the target, and used a runtime and actions several years out of date. Anyone reading the repository would assume deployment was automated. | **A pipeline that does not run is worse than none.** Delete it or fix it. |
| **A placeholder production API address** | The production environment file pointed at a placeholder domain, relying entirely on an override at the hosting layer. | Configuration should be readable as the truth. |
| **Branch drift** | The frontend's main branch was thirty-two commits behind the working branch; the API had seven local branches with unclear relationships. | One trunk, short-lived branches. Resolve before starting new work. |
| **In-process job scheduling** | A recurring task ran on an in-process timer. Restart the process and pending work vanishes; run two instances and everything fires twice. | **Durable, database-backed job queue.** See [../architecture/background-jobs.md](../architecture/background-jobs.md). |

---

## 🔐 Group 7 — The authentication bootstrap

Worth its own section, because the commit history shows how much time it consumed.

There is a run of consecutive commits fighting the same problem: improving token initialisation logging, adding a forced timeout in a route guard, extending that timeout, adding mobile-specific safety checks, then reducing the logging again. The access token lived in a module-level variable in the browser and the refresh token in a cookie scoped to the API, with a hand-rolled initialisation race resolved by timeouts.

| Rule it produced |
| --- |
| **Do not write authentication again.** Use a managed provider with first-party client libraries for web and native. |
| **If a route guard needs a timeout, the session model is wrong.** Guards read a resolved state, never a "maybe a token is coming" state. |
| **Keep authenticated server-side rendering off the critical path.** The pages that need search visibility need no authentication, so the whole benefit ships without re-entering this problem. |

See [../architecture/auth-and-identity.md](../architecture/auth-and-identity.md).

---

## 🧭 Group 8 — The pattern behind all of it

The individual defects are fixable. The pattern that produced them is the real lesson.

**What was built:** a report-to-discipline-to-appeal pipeline, a violation matrix, moderator case claiming, appeal statistics by date range, a four-role hierarchy, and a four-thousand-line admin dashboard.

**What was not built:** working search, pagination, analytics, link previews, or a promotion mechanic that did anything.

An appeals tribunal was built for a platform where a buyer could not search and could only ever see ten listings.

| The rule |
| --- |
| **Build the thing that proves demand before the thing that manages scale.** Formalised as the validation gate in [../product/roadmap.md](../product/roadmap.md). |

This is not a criticism of ability — 900 commits and two delivered client projects settle that question. It is an observation about where the hours went, and it is the single most important input to how v2 should be sequenced.

---

## ✅ What v1 got right

Worth recording, because these carry over unchanged.

| Decision | Why it was right |
| --- | --- |
| **Object storage with no egress charges for images** | For an image-heavy marketplace, bandwidth is the dominant variable cost. This turns it into a fixed one. The best technical decision in the project. |
| **Direct uploads bypassing the API** | Large binary payloads never touch the application service. |
| **Client-side image compression** | Reduces cost for a user paying for mobile data. |
| **Environment files never committed** | Correctly ignored in both repositories. |
| **Structured logging** | Added late, but the right call. |
| **Rich specification fields on items** | The data model already anticipated specification-aware search, even though the search was never wired up. |
| **The discipline and appeals domain** | Genuinely substantial work, and the reason the platform can stay out of payments — accountability substitutes for escrow. |
| **A promotion flag on listings** | The instinct to monetise visibility was modelled before it was decided. |
| **Both swap directions modelled** | The posting form offered adding and receiving cash from the beginning. |

---

## Related documentation

- [Validation Test](../operations/validation-test.md) — the fix list, prioritised
- [Product Principles](../product/principles.md) — the rules these failures produced
- [Auth & Identity](../architecture/auth-and-identity.md) — groups 1, 4 and 7
- [SEO & Rendering](../architecture/seo-and-rendering.md) — group 3
- [Roadmap](../product/roadmap.md) — group 8

---

**Last Updated:** September 2026
