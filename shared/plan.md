# Backend Architecture Plan

The current code is test scaffolding and can be refactored freely. This is the
target shape — how REST controllers, websocket gateways, services, and (later) a
database relate to each other.

## The one rule everything hangs off

**Transports are thin. All state changes go through the service layer.**

A controller and a gateway are both just transports: they validate a payload,
call a service method, and return/emit the result. Neither of them ever touches
the store/database directly. The service owns business rules (id generation,
timestamps, "can this user do this"), and the store owns persistence.

```
HTTP request ──► Controller ──┐
                              ├──► Service ──► Store (Map now, DB later)
WS message ────► Gateway ─────┘        │
                                       ▼ emits domain event
                              Gateway broadcasts to room(s)
```

## "Do I need to post to my database inside my websockets?"

No — and mostly you won't need websocket *writes* at all. The clean split:

- **Reads: REST.** react-query already does caching, refetching, and devtools.
  Don't ship initial state over sockets; `GET` it.
- **Writes: REST.** `POST /questions`, `POST /questions/:id/vote`, etc. The
  writer gets a normal HTTP response (status codes, validation errors, retries
  all work like everything else).
- **Websockets: server → client push only.** Broadcasts of things *other
  clients* did, plus presence. The client barely ever calls `socket.emit()`
  except to join/leave rooms.

So the flow for "someone posts a question" is:

1. Client A: `POST /questions` → controller → `questionsService.create()` →
   store write → returns the created question to A.
2. The service emits a domain event (`question.created`) via Nest's
   `EventEmitter2`.
3. The gateway listens for that event and broadcasts it to the relevant room.
   Clients B and C merge it into their react-query cache.

This decouples everything: the controller doesn't know the gateway exists, the
gateway doesn't know HTTP exists, and if you later *do* want a websocket write
(e.g. high-frequency typing indicators), its handler just calls the same
service method — the broadcast side doesn't change.

The exception that's allowed to skip REST: genuinely ephemeral, never-persisted
signals (typing, cursor positions, presence heartbeats). Those can be pure
gateway → gateway relays because there's no state change to protect.

## One socket, rooms — not a namespace per feature

Current setup has three namespaces (`/questions`, `/presence`, `/likes`) and
each UI hook opens its own connection, which is why presence double-counts and
events cross wires. Target:

- **Server: one gateway** (default namespace) as the single push channel. It
  handles connect/disconnect (presence), `room:join` / `room:leave`, and relays
  domain events. Feature modules don't own gateways; they emit events.
- **Client: one socket**, created once in a provider/context, shared by every
  hook. Hooks subscribe to events; they never construct sockets.
- **Rooms per entity**, named by convention in `shared/constants.ts`:
  `question:{id}` (its chat), `questions` (the list page), `user:{id}`
  (targeted pushes like new DMs). Broadcast scope = room membership.
- **Presence falls out for free**: one connection per client means the gateway
  can count sockets (or track socket ids in a `Set`) with no per-namespace
  bookkeeping. `total online` is one number; per-room counts come from room
  membership if ever needed.

## Module shape

Each feature keeps a module, but the pieces are:

```
server/src/questions/
  questions.module.ts
  questions.controller.ts   # HTTP only: GET/POST/DELETE, zod-validated bodies
  questions.service.ts      # rules + emits domain events after each write
  questions.store.ts        # in-memory Map seeded from mock JSON (today)

server/src/realtime/
  realtime.gateway.ts        # the single gateway: presence, rooms, relaying
  realtime.module.ts
```

The store is behind a small interface (`get`, `list`, `create`, `update`,
`delete`) so swapping `Map` → TypeORM/Prisma repository later only touches
`*.store.ts`. Services and transports never change for the DB migration —
that's the payoff for the layering.

## Shared contract (`shared/`)

Three kinds of schema, all zod, all consumed by both sides:

1. **REST responses** — already exist.
2. **REST request bodies** — new (`createQuestionSchema`, `sendMessageSchema`,
   …). Controller pipes validate with them; UI forms infer types from them.
3. **WS event payloads** — new. One schema per domain event, plus a constants
   map of event names and room-name builder functions
   (`rooms.question(id)` → `"question:{id}"`), so client and server can never
   drift on strings.

## Where each current feature lands

| Feature | Reads | Writes | Push |
|---|---|---|---|
| Questions list | `GET /questions` | `POST /questions`, `POST /:id/vote`, `DELETE /:id` | `question.created/voted/deleted` → `questions` room |
| Question chat | `GET /questions/:id/chat` | `POST /questions/:id/chat`, vote | `chat.message` → `question:{id}` room |
| Friends | `GET /friends` | `POST /friends` | none for now (no second real user yet) |
| Messages | `GET /messages/:friendId` | `POST /messages/:friendId` | `message.received` → `user:{id}` room, when identity exists |
| Likes | `GET /likes` | `POST /likes` (convert from WS write) | `likes.updated` → everyone |
| Presence | — | — | `presence.updated` on connect/disconnect |

## Suggested build order

1. **Skeleton**: single `RealtimeGateway` + client socket provider +
   `EventEmitter2` wiring. Prove it with likes (smallest feature): REST write,
   event, broadcast, cache merge. Delete the old three gateways and `useRoom`.
2. **Questions + chat** on the same pattern (the real Slido core).
3. **Identity** (persistent anonymous id) — prerequisite for messages push and
   any authorship rules.
4. **Friends/messages** writes (REST-only is fine until multi-user is real).
5. **DB** behind the store interface; **tests** on services/stores, which the
   layering has made pure and easy to test.
