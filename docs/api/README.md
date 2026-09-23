# API Documentation

## The contract between every client and the system

---

## 📋 Contents

- **[endpoints.md](./endpoints.md)** — every endpoint by area, with purpose, access level and behaviour

---

## 🎯 Design rules

### 1. One contract, all clients

The marketplace web app, the dealer console, staff tools and the eventual mobile app all use this API. Nothing bypasses it, and nothing has a private path.

### 2. REST with a published machine-readable contract

The contract is generated from the same schema definitions used to validate requests, so it cannot drift from the implementation.

**Why REST rather than a TypeScript-only approach:** a TypeScript-to-TypeScript layer has excellent ergonomics for a web-only product and produces nothing a Swift or Kotlin client can consume. Choosing it would trade away the native path that is explicitly wanted. A published contract generates typed clients for every language.

### 3. Protected by default

Every endpoint requires authentication **unless it appears on the public list** in [endpoints.md](./endpoints.md).

This inverts v1, where routes were public unless someone remembered to add protection — and on several routes nobody did, leaving listings editable and deletable by anonymous callers.

### 4. Ownership checked in the service layer

Route-level authentication answers "is this a real user." Service-level ownership answers "is this *their* listing." Both are required. A service function that mutates a listing takes the acting user and refuses to act on someone else's.

### 5. Schema-validated in, typed out

Every request body and query string is validated against a schema at the boundary. Invalid input is rejected with a useful message before reaching any domain logic.

### 6. Literal routes before parameterised ones

Route ordering matters. A parameterised path registered before a literal path at the same depth will swallow it.

In v1 this was a live defect: several administrative endpoints were unreachable because a single-segment parameterised route was registered first and matched the literal path as an identifier instead.

### 7. Contact details are never in a listing response

They are served only by the dedicated reveal action, which records the event and applies rate limits. In v1 the public listing endpoint included every seller's email address and phone number, so the entire seller base was scrapable without signing in.

---

## 🔢 Conventions

| Aspect | Convention |
| --- | --- |
| Versioning | A version prefix on all paths |
| Identifiers | Opaque identifiers in the API; readable slugs for public web URLs |
| Collections | Cursor-based paging, stable under insertion |
| Filtering | Query parameters, mirroring the public URL filter state |
| Errors | Consistent shape with a machine-readable code and a human-readable message |
| Times | Always absolute and timezone-explicit |
| Money | Always an amount plus an explicit currency, never an amount alone |
| Rate limits | Communicated in response headers |

---

## 🔗 Related documentation

- [System Overview](../architecture/system-overview.md) — the API-as-system-of-record rule
- [Auth & Identity](../architecture/auth-and-identity.md) — authentication and the role hierarchy
- [Data Model](../architecture/data-model.md) — the entities behind the endpoints
- [Features](../features/) — the behaviour each endpoint serves
- [v1 Lessons](../reference/v1-lessons.md) — the route and exposure failures above

---

**Last Updated:** September 2026
