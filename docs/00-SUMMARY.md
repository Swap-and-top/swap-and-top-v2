# Swap & Top v2 — Plain Summary

## The whole thing in one read, no jargon, no code

**Status:** Decided
**Read this if:** you are new to the project, or you need to explain it to someone in five minutes.

---

## 🎯 What it is

Swap & Top is a marketplace for second-hand gadgets in Zimbabwe — phones, laptops, desktops, consoles and computer parts.

It does one thing no other platform here does properly: it lets you **trade the gadget you already own towards the one you want, adding or receiving cash to make up the difference.** That is the "swap and top" idea, and it came from a real, repeated question — customers looking at gadget adverts kept asking the seller whether he would do a swap deal.

Alongside swapping, people can straightforwardly **sell** things and **say what they are looking for**. Later on there will be **auctions**.

---

## 🤝 How it works, in practice

The platform introduces two people to each other. It does not handle their money.

1. Someone posts a gadget for sale, a swap they want, or a request for something.
2. Buyers browse or search, and tap a button to reveal the seller's phone number.
3. The two of them agree and meet up. Cash changes hands between them, not through us.

This is deliberate. Handling other people's money means escrow, refunds, disputes and fraud, and that is a different and much larger business. We stay out of it for now.

---

## 👥 Who it is for

**Buyers and browsers** — anyone. No account needed to look, search, or get a seller's number. Friction here is the enemy.

**Private sellers and swappers** — mostly university students to begin with. They want better gadgets than they can afford new, so trading up is exactly their situation.

**Dealers** — phone shops, computer shops, repair shops, console sellers. They are the ones who will pay us.

---

## 💡 The idea that makes it work

A swap post is not just a listing. It is a **precise statement of demand with a trade-in attached.**

> "I have a MacBook Air 2017, I want any i7 with 16GB, and I will add $240."

That tells a dealer exactly what someone wants, exactly what they are trading in, and exactly how much cash they have. That is a very good sales lead.

Facebook Marketplace cannot do this. Facebook is a board of things for sale — demand is invisible. On Swap & Top, demand is a first-class citizen.

So the feature that attracts ordinary users and the product that dealers pay for are **the same thing**. And the lead list fills itself from day one, because every swap post is already a request.

---

## 💰 How it makes money

Posting is **free for everyone**. We are competing with Facebook, which is free, and every listing is inventory we need. Charging sellers to post would starve the platform.

We charge dealers for two things instead:

| What dealers pay for | Why they pay |
| --- | --- |
| **Lead alerts** — told immediately when someone posts a request matching their stock | In trade-in deals the first credible offer usually wins. Speed is money. |
| **Dealer console** — a simple system to run their stock, sales and trade-ins | Most shops run on paper and WhatsApp. This saves them real time. |
| **Sponsored slots** — a labelled placement in the browsing feed | Once there is traffic, visibility is worth buying. |
| **Friday Drop slots** — a place in a weekly batch of checked deals | Attention is concentrated at a set time, so the slot is worth more. |

Lead alerts and the console earn from day one, because their value does not depend on how much traffic we have. Sponsored slots only become worth paying for once people are actually browsing.

---

## 🧭 Why people would choose us over Facebook

Being "less cluttered than Facebook" is not a reason to switch. These are:

**You can actually find things.** A laptop has a processor, memory, storage, graphics card, screen and condition. Searching Facebook for "16GB i7 laptop" is close to useless. Here it is a normal search. This matters most for computers, which is why computers lead the product even though phones bring more traffic.

**The swap mechanic.** Nobody else has it.

**Google and WhatsApp.** Facebook Marketplace listings barely show up in Google searches. Ours will. And every listing shared into WhatsApp will show a proper preview with a photo and a price — which the old version of the app did not.

**Trust signals.** Verified dealers, verified students, and eventually a physical place to meet and check a device.

---

## 🧱 What we are building first

The first version is deliberately small:

- One browsing feed mixing sale posts, swap posts and requests, with filters
- Search that understands gadget specifications
- A three-way posting flow: sell something, swap something, or say what you want
- Contact reveal behind a button, so we can count it
- A dealer console for stock and leads
- Verified dealer and verified student badges

---

## 🚧 What we are deliberately not building yet

- **Auctions.** They need a crowd. An auction that closes with no bids tells everyone the place is empty. They come after a weekly "drop" habit has built an audience.
- **Payments between users.** Contact-broker only.
- **Delivery and warehousing.** Later, and the family's Waterfalls property is the eventual home for it.
- **A phone app.** Nobody installs an app for an empty marketplace. Web first.
- **Subscription tiers for ordinary users.** One free tier, and dealers pay.

---

## ❓ What still has to be proven

Everything above rests on assumptions that are not yet tested. The honest list:

1. **Will dealers pay?** Nothing else matters as much. Five dealers paying anything is the signal.
2. **Will swap posts get answered?** A feed of unanswered requests kills the platform in a fortnight. Dealers are the fix, which is why they have to arrive at the same time as users, not afterwards.
3. **Will people come back?** Deal-browsing has to become a habit, not a one-off visit.
4. **Who runs Zimbabwe on the ground?** The founder is relocating to Brazil. A local operator has to be found, or this stalls.

See [operations/validation-test.md](./operations/validation-test.md) for how each of these gets answered, and what counts as a pass or a fail.

---

## 🏢 Where it sits

Swap & Top is intended to become its own company under **Greta Works International**, a US holding company. Its sister company, **Greta Works Digital**, builds custom software for small businesses and already has paying clients.

The dealer console is the bridge between the two: it is a Greta Works Digital product sold to Swap & Top's dealers. Full detail in [business/company-structure.md](./business/company-structure.md).

---

## 📎 Where to go next

| You want to… | Read |
| --- | --- |
| See the whole documentation map | [README.md](./README.md) |
| Understand the market case | [business/the-wedge.md](./business/the-wedge.md) |
| See the screens | [product/information-architecture.md](./product/information-architecture.md) |
| Understand the technical shape | [architecture/system-overview.md](./architecture/system-overview.md) |
| Know what broke in v1 | [reference/v1-lessons.md](./reference/v1-lessons.md) |
| See every decision and why | [reference/decisions-log.md](./reference/decisions-log.md) |

---

**Last Updated:** September 2026
**Documentation Version:** 2.0
**Platform Version:** v2 — pre-build specification
