# Friends & Messages Service — Implementation Plan

Scope: a separate microservice from the games-service (this repo's `server/`)
and the future auth-service. Owns Friends (add/list/remove), Messages
(per-conversation live chat), and Profiles (see below). Structure below is a
starting map, not gospel — change it as you build.

> Note: `server/` has since pivoted from "questions-service" (Slido) to the
> games-service (game hub + quizzes + forums). References below to the
> "questions-service" / `QuestionsGateway` describe patterns that now live in
> `GamesModule`/`GamesGateway` — the layering rules are unchanged. See
> `shared/plan.md` for the overall roadmap; this service is phase 4 there.

## Profiles live here (for now)

Decision (2026-07-10): profiles are a `ProfilesModule` **inside** this
service, not a third microservice. Profile data (name, email, bio, online
flag) is small and its only consumers are the friends list and the profile
page — the same service that owns friends. Give it its own tables and routes
(`GET/PATCH /profiles/:id`) so there's a clean seam to extract it later
(likely into/alongside the auth-service) if it grows real weight — avatars,
settings, presence preferences. A third deployable today is operational cost
plus cross-service joins for no benefit.

## Why this is split out

`server/` is now scoped to Questions + Presence only. Friends/Messages were
removed from it (controllers, services, gateway, mock data) on 2026-07-04.
Their zod schemas were also removed from `shared/apiSchema.ts` — this doc is
where those shapes live now until the new service re-introduces them.

## Dependency on auth-service

Everything below assumes a real identity exists (a `userId` from an
authenticated session/JWT). Two things in the old implementation were hacks
that only worked because there was no real auth:

- `Message.author: 'me' | 'them'` — only meaningful from one hardcoded
  viewer's perspective. Replace with `senderId` (+ derive "is this me?" on
  the client by comparing to the logged-in user's id).
- `POST /friends` instant-added a friend with no concept of *whose* friend
  list it was. Decide before building: instant-add (simple, current
  behavior) vs. request/accept flow (`pending` → `accepted` status,
  needs the other user to exist and confirm).

## Data model (re-add to `shared/apiSchema.ts` when scaffolding this service)

```ts
Friend: { id, userId, name, email, bio, isOnline }
// userId = whose friend-list entry this is, once auth exists

Message: { id, conversationId, senderId, content, sentAt }
// conversationId replaces today's "friendId" if you want to support
// more than 1:1 later; senderId replaces the 'me'/'them' enum
```

## REST CRUD endpoints

### Friends
| Method | Route | Notes |
|---|---|---|
| GET | `/friends` | list current user's friends |
| POST | `/friends` | add a friend — decide instant-add vs request/accept (see above) |
| DELETE | `/friends/:id` | remove a friend |
| PATCH | `/friends/:id` | edit bio/etc — low priority, no UI need today |

### Messages
| Method | Route | Notes |
|---|---|---|
| GET | `/messages/:conversationId` | conversation history |
| POST | `/messages/:conversationId` | send a message |
| DELETE | `/messages/:id` | unsend — optional/future |
| PATCH | `/messages/:id` | edit — optional/future |

Same layering rule as the questions-service: controller calls service
(persists to DB), then calls the gateway's broadcast method with the
service's return value — never broadcast the raw request body.

## WebSocket emits — exact wiring

Reuse these constant names in `shared/constants.ts` (`ws.messages` block was
removed in this cleanup — bring it back verbatim, it already matched this
design):

```ts
ws.messages: {
  MESSAGE_ROOM: "message-room",       // join/leave event name
  MESSAGE_ADDED_EVENT: "message-added",
}
```

- `POST /messages/:conversationId` → `messagesService.addMessage(...)` →
  `messagesGateway.broadcastMessageCreated(conversationId, message)` →
  emits `MESSAGE_ADDED_EVENT` scoped to room `conversationId`
  (`this.server.to(conversationId).emit(...)`). Clients join that room via
  `MESSAGE_ROOM` / leave via `MESSAGE_ROOM + '_leave'`, same pattern as
  `QuestionsGateway.joinQuestionsRoom`.
- `POST /friends` → once identity exists, notify the *added* user
  specifically (`this.server.to(targetUserId).emit('friend-added', friend)`)
  rather than a global broadcast — there's no shared "room" for friends the
  way there is for a conversation, so the room key here should be the
  target user's own id/socket, not a conversation id.
- `DELETE /friends/:id` → same idea, notify the affected user if you want
  their friend list to update live elsewhere.

## Cross-service presence — Redis becomes required here

Today, `UserPresenceService` in the questions-service is an in-memory
`Map<namespace, count>` local to that one process, and
`UserPresenceGateway` broadcasts the sum over its own `/presence` socket.io
namespace. That was fine when "presence" only meant sockets connecting to
that one process.

Once this service is a separate process, its socket connections
(`/messages`, and later `/friends`) are invisible to the questions-service's
in-memory map — presence tracking no longer has one process to live in.
Recommended design:

1. Each service keeps a Redis **set** of its own live connection/socket ids
   (not a plain INCR/DECR counter) — e.g. `presence:friends-service`,
   `presence:questions-service` — added on connect, removed on disconnect.
   A set is safer than a counter: if a process crashes without a clean
   disconnect, a counter stays wrong forever, but a set of socket ids can be
   reconciled/expired (e.g. `SCARD` after pruning dead ids, or give entries
   a TTL and have clients heartbeat).
2. On any change, publish to a Redis pub/sub channel, e.g. `presence:changed`.
3. The questions-service (already the owner of `/presence`, which the
   frontend already connects to via `useOnlineCount`) subscribes to that
   channel, recomputes the total as the sum of `SCARD` across all services'
   keys, and broadcasts it over its existing `/presence` namespace exactly
   as it does now. The frontend's contract doesn't change — it still just
   connects to questions-service's `/presence`.
4. `ioredis` is already a dependency (`server/package.json`) — reuse it
   here rather than introducing a different client.

This keeps `/presence` a single well-known endpoint owned by one service
while aggregating presence contributed by N services behind it.

## Persistence

Own Postgres schema/tables (`Friend`, `Message`) via TypeORM — a real
microservice split should mean this service owns its own data, not shared
tables with the questions-service.

## Open questions — resolved (2026-07-10, see shared/plan.md phase 4)

- [x] Friend "add" semantics: **instant add for v1** — there's no auth to
      gate a request/accept flow on. Revisit request/accept after the
      auth-service exists.
- [x] Message identity: **client-generated persistent id** (localStorage)
      as `senderId` until auth exists — explicitly temporary, swapped for
      the JWT subject when the auth-service lands. Never `'me'/'them'`.
- [x] Conversations: **use `conversationId` from day one** — cheap now,
      enables group chat later without a data migration.
- [x] Gateways: **yes** — this service runs its own socket.io server (own
      port) for `/messages` (and `/friends` notifications), while
      `/presence` stays solely owned by the games-service, aggregating via
      Redis per the design above.
