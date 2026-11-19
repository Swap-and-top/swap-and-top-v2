# Chat

## Messages in the app, as a contact way or after an accepted offer

**Status:** Approved by Hillary with one change (2026-11-19): Message is a contact way the poster chooses. Being built.
**Read this if:** you are building or changing messaging, offers, notifications or moderation.

---

## In short

A poster can let people message them inside Swap & Top, as one of their
contact ways beside WhatsApp and a call. If they do not, a chat still opens
once they accept someone's offer. Messages arrive at once
(Socket.IO), are kept in our own database, and Trust and safety can act on
a chat that is reported. Nothing goes through an outside chat service.

---

## What users see

1. **Message** as a contact way. When posting, beside WhatsApp and Call,
   the poster can tick **Message in the app**. Then Show contact on their
   listing offers **Message** too, to anyone their contact settings allow
   (signed in users only, since a chat needs an account).
2. **A Message button on an accepted offer**, for both sides, whether or
   not the poster ticked Message: on the offer in Me, Offers, and on the
   listing's offers for its owner.
3. **A Messages page** (`/messages`), opened from the menu and the header
   with a count of unread chats. One line a chat: the other side's name,
   the listing's photo and title, the last message and when.
4. **A chat** (`/messages/{id}`): the listing at the top (photo, title,
   price), the messages below, newest at the bottom, and one text box with
   Send. Each message shows when it was sent and, on your own, Seen once
   the other side has read it. While the other side types, "typing…".
5. **Report** and **Block** in the chat's menu (the three dots).
6. A **notification** for a new message when you are not in that chat,
   and the unread count in the header.

Text only to start: no photos, voice notes or files (see "Not in the
first version").

---

## Who can chat

- **The poster ticked Message:** anyone signed in whom their contact
  settings allow (for example, signed in users only, or not stores) can
  start a chat from the listing. One chat per listing and person: asking
  again opens the same chat.
- **The poster did not tick it:** only the two sides of an **accepted**
  offer: the user who sent it, and the listing's owner.
- A poster can untick Message later; chats already started stay open.
- **A store's listing:** the chat is with the store. Its owner and members
  see it in the Store console (a Messages page there) and reply as the
  store's name. A store's pass is not needed to read or reply.
- **Declined or withdrawn** offers never open a chat (unless Message is
  ticked, which lets anyone start one). A chat stays open
  after the deal is done, so they can sort out the meeting.
- **Banned or suspended:** a banned user's chats close for both sides
  ("This chat is closed"); a suspended user can read but not send until
  the suspension ends. The API refuses, not only the screen.
- **Blocked:** either side can block the other. The chat closes for both,
  and the blocked user is not told who blocked them, only that the chat
  is closed. Unblocking reopens it.

---

## Safety

- **A note at the top of every chat:** "Meet in public, and check the
  item before you pay. Never pay before you have seen it." (the same
  advice as Show contact).
- **Report:** from the chat's menu, with the usual reasons plus "Asking
  for money first" and "Abusive messages". It goes to Reports in the
  Staff console like any other report.
- **Staff read a chat only when it is reported**, and only that chat.
  Opening it logs a look in the Activity log, as opening a user's record
  does. No one on the team can browse chats.
- **Limits:** at most 30 messages a minute from one user, and at most
  2,000 characters a message, so a chat cannot be flooded.

---

## How it works

```
Phone or laptop ── live connection ──► Chat app (Socket.IO)  ─┐
       │                               on the same Dokploy     │
       │                               at /socket              ├─► our Postgres
       └── normal pages and API ─────► the Swap & Top site ────┘   (same database)
```

- **The chat app** is a small separate Node program with Socket.IO, in
  this repository (`apps/chat`), deployed as its own app in the same
  Dokploy environment as the site: one for staging, one for production.
  It is reached at `/socket` on the site's own address, so the browser
  sends the same sign in cookie and no new login is needed.
- **Sign in:** when a phone connects, the chat app checks its cookie
  against `auth_sessions`, exactly as the API does. No cookie, no
  connection.
- **Sending:** the message is saved in the database first, then passed to
  the other side if they are connected. If they are not, it waits in the
  database, and a notification is made. Nothing is lost while someone is
  offline.
- **Reading old messages and the chat list** go through the normal API
  with TanStack Query (`GET /api/chats`, `GET /api/chats/{id}/messages`),
  so the pages load the usual way, with their skeletons.
- **Patchy connections:** Socket.IO reconnects by itself and falls back
  to its own polling where a network blocks live connections. On
  reconnecting, the chat fetches anything it missed.
- **Size:** about 60 to 80 MB of memory idle, and about 50 MB more per
  thousand users connected at once. Johannesburg has room for many times
  that.
- **Later, if we run more than one copy of the chat app,** they share
  messages through Redis. One copy is enough for a long time.

---

## Storage

Two new tables in the same database (one migration), kept in the nightly
backups:

- **chats:** id, the listing, the offer it came from (none when started
  by Message), the user who offered, the
  listing's owner (a user or a store), when it opened, when the last
  message came, and whether it is closed (and why: banned, blocked).
- **chat_messages:** id, the chat, who sent it (and as which store),
  the text, when it was sent, when the other side read it.
- **chat_blocks:** who blocked whom, and when.

**Kept:** while both accounts exist. When a user deletes their account on
a data request, their messages are removed with it; the other side sees
"This message was deleted". The privacy policy gets a line saying messages
are stored, and that our team reads a chat only when it is reported.

---

## For stores

- A store's Messages page in the Store console, with the same chats.
- **Leads:** a chat on a store's listing counts as a lead, beside a
  number shown, so the Leads page and Stats keep telling stores what
  their pass brings.

---

## Not in the first version

Photos and voice notes in a chat; chats before an offer is accepted;
group chats; email or SMS when a message arrives (until real SMS is set
up); editing or deleting a sent message. Each can come later.

---

## Building it, step by step

1. The tables and the API to list chats and read messages, with the
   rules above.
2. The chat app (Socket.IO) in `apps/chat`, its sign in check, sending,
   Seen and typing.
3. The Messages page, the chat page and the Message button, with
   skeletons; the unread count and notifications.
4. Report, Block, closing on a ban, and reported chats in the Staff
   console with the look logged.
5. The Store console's Messages page, and chats counted as leads.
6. Tested on localhost (two browsers, a phone), then **pushed to staging**
   with the chat app added there, and **tested by Hillary on staging**,
   before production.

About 3 to 4 days of work.

**From Hillary in Dokploy, once:** a new app for the chat in the staging
environment (and later production), from this repository, and a `/socket`
path on the site's domain pointing to it. Steps will be given at the time.

---

## Decisions for Hillary

Settled on 2026-11-19: Message is a contact way the poster chooses, and
an accepted offer always opens a chat; stores chat as the store; staff
read a chat only when it is reported; text only to start.
