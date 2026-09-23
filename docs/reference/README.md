# Reference Documentation

## Shared vocabulary, decision history, and what v1 taught us

---

## 📋 Contents

- **[v1-lessons.md](./v1-lessons.md)** — every verified failure in the first version, and the rule each one produced. **Read this before writing any code.**
- **[decisions-log.md](./decisions-log.md)** — every significant decision, its reasoning, and its status
- **[glossary.md](./glossary.md)** — shared vocabulary

---

## 🎯 Why these documents exist

### v1 lessons

The first version was built over three years by someone learning to code while building it. That was a reasonable trade — it produced a skilled developer — but it left a codebase with specific, verifiable defects.

Those defects are not embarrassing history. They are **the most valuable input to v2**, because each one is a real failure with a known cause, and each produced a rule. A plan that does not honour those rules will reproduce them.

### Decisions log

Everything in this documentation set is a decision, and decisions are only durable if the reasoning survives with them. Without the reasoning, a later reader sees an arbitrary constraint and routes around it.

The log also tracks what is **still open**, which matters because several open questions block real work.

### Glossary

Several words in this project mean something specific. "Reveal" is an event, not a UI state. "Lead" is a listing seen from a dealer's side. "Drop" is a scheduled event. Getting these consistent keeps the documentation, the code and the conversations aligned.

---

## 🔗 Related documentation

- [README](../README.md) — the documentation index
- [Roadmap](../product/roadmap.md) — what the decisions add up to
- [Validation Test](../operations/validation-test.md) — the open questions that matter most

---

**Last Updated:** September 2026
