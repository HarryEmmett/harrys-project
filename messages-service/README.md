# messages-service

A Go template for the Messages half of
[`shared/friends-messages-service-plan.md`](../shared/friends-messages-service-plan.md):
a REST API for conversation history plus a WebSocket hub that pushes new
messages to everyone in that conversation.

It runs standalone — `go run ./cmd/server` with no arguments starts on `:4000`
with an in-memory store. It is a **template**: the layering, wiring, tests and
config are done, and the parts that need product decisions (auth, friends,
presence) are marked below.

## Layout

```
cmd/server/          entrypoint — config, store selection, graceful shutdown
internal/domain/     Message + request types, validation, id generation
internal/store/      MessageStore interface (the persistence seam)
  memory/            in-process store — the default, used by the tests
  postgres/          pgx-backed store + schema.sql
internal/api/        router, middleware, HTTP handlers
internal/ws/         hub (rooms), client (read/write pumps), upgrade handler
```

Dependencies are deliberately two: `gorilla/websocket` and `jackc/pgx`.
Routing, JSON, logging and config are standard library.

## Running it

```bash
go run ./cmd/server                  # in-memory, :4000
go test -race ./...                  # everything except the Postgres store
go vet ./...
```

Or via the Makefile: `make run`, `make test`, `make check`.

### Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | `server/` uses 3000, so this avoids a clash |
| `MESSAGES_STORE` | `memory` | or `postgres` |
| `ALLOWED_ORIGINS` | `*` | comma-separated; tighten before deploying |
| `DATABASE_URL` | — | wins over the `DB_*` parts below |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `5432` / — / — / — | same names as the repo-root `.env` |
| `DB_SSLMODE` | `disable` | |

### Postgres

This service owns its own tables — point `DB_NAME` at its own database, not
the games-service's. There is no TypeORM `synchronize: true` here, so apply
the schema yourself:

```bash
createdb messages
psql "postgres://user@localhost:5432/messages" -f internal/store/postgres/schema.sql
MESSAGES_STORE=postgres go run ./cmd/server
```

The Postgres tests are integration tests against a real database and skip
unless `TEST_DATABASE_URL` is set:

```bash
TEST_DATABASE_URL="postgres://user@localhost:5432/messages_test?sslmode=disable" \
  go test ./internal/store/postgres/
```

## REST API

| Method | Route | Response |
| --- | --- | --- |
| `GET` | `/healthz` | `{ status, clients }` |
| `GET` | `/messages/{conversationId}` | `{ messages: Message[] }`, newest first |
| `POST` | `/messages/{conversationId}` | `201` + the created `Message` |
| `PATCH` | `/messages/{id}` | `200` + the updated `Message` |
| `DELETE` | `/messages/{id}` | `204` |
| `GET` | `/ws` | WebSocket upgrade |

`Message` is the shape from the plan — `{ id, conversationId, senderId,
content, sentAt }`. There is no `'me' | 'them'` author field: clients compare
`senderId` to their own id. `sentAt` is RFC 3339, matching the ISO strings the
games-service returns.

History is paged with a keyset cursor rather than an offset, because a
conversation grows at the tail while you read it and offsets would skip or
repeat rows:

```
GET /messages/conv-1?limit=50
GET /messages/conv-1?limit=50&before=2026-07-30T12:00:00Z   # next page
```

Bodies are decoded with unknown fields rejected — the equivalent of `.strict()`
on the zod schemas in `shared/apiSchema.ts`. Errors use NestJS's shape
(`{ statusCode, message, error }`) so the frontend can handle failures from
this service and from `server/` with one code path.

## WebSocket protocol

**This is a plain WebSocket server, not socket.io.** `server/` speaks socket.io
via Nest gateways; this service speaks a JSON envelope over a raw WebSocket, so
the UI needs a plain `WebSocket` for it (or a small adapter). That is the one
deliberate deviation from the plan — a socket.io implementation in Go would be
a much larger dependency for a protocol only one service needs.

Every frame, in both directions:

```jsonc
{ "event": "message-added", "data": { /* … */ } }
```

| Event | Direction | Data |
| --- | --- | --- |
| `message-room` | client → server | `{ conversationId }` — join; echoed back on success |
| `message-room_leave` | client → server | `{ conversationId }` — leave; echoed back |
| `message-added` | server → client | the created `Message` |
| `message-updated` | server → client | the updated `Message` |
| `message-deleted` | server → client | `{ id, conversationId }` |
| `error` | server → client | `{ message }` |

Broadcasts are scoped to the room named after the conversation id, so a client
only receives conversations it joined.

These names are the `ws.messages` block the plan asks you to restore in
`shared/constants.ts`:

```ts
ws: {
  messages: {
    MESSAGE_ROOM: "message-room",
    MESSAGE_ROOM_LEAVE: "message-room_leave",
    MESSAGE_ADDED_EVENT: "message-added",
    MESSAGE_UPDATED_EVENT: "message-updated",
    MESSAGE_DELETED_EVENT: "message-deleted",
  },
}
```

Client sketch, to sit behind a `useMessagesSocket` hook next to
`ui/src/hooks/useGamesSocket.ts`:

```ts
const socket = new WebSocket("ws://localhost:4000/ws");

socket.onopen = () =>
  socket.send(JSON.stringify({
    event: constants.ws.messages.MESSAGE_ROOM,
    data: { conversationId },
  }));

socket.onmessage = (e) => {
  const { event, data } = JSON.parse(e.data);
  if (event === constants.ws.messages.MESSAGE_ADDED_EVENT) {
    queryClient.setQueryData([MESSAGES_KEY, conversationId], append(data));
  }
};
```

## Design notes

**Persist, then broadcast.** Handlers call the store, then hand the *returned*
value to `hub.Broadcast` — never the raw request body. Same layering rule as
the Nest gateways in `server/`, and it is why every client sees identical ids
and timestamps.

**The store is an interface.** `api` depends on `store.MessageStore`, so
swapping memory for Postgres is a wiring change in `main` and nothing else.
Implementations translate their own errors into `domain.ErrNotFound`;
`pgx.ErrNoRows` never escapes the postgres package.

**Slow clients get dropped, not waited on.** Each connection has a 32-frame
buffer; a client that falls behind is closed rather than allowed to block
every other writer. It reconnects and refetches history over REST.

**One writer per connection.** All writes go through the client's `send`
channel because gorilla permits only one concurrent writer per connection.

**No `WriteTimeout` on the server.** It would cut off long-lived WebSocket
connections mid-stream; the ws package sets per-write deadlines instead.

**Origins are checked on upgrade.** Browsers send no CORS preflight for a
WebSocket upgrade, so `ws.Handler` checks `Origin` against the same config the
CORS middleware uses.

## Not implemented — where to take it next

- **Auth.** `senderId` is whatever the client sends. Every route is
  unauthenticated and nothing checks that a sender may post to a conversation.
  When the auth-service lands, take `senderId` from the JWT subject in
  middleware and drop it from the request body — the plan's "explicitly
  temporary" client-generated id.
- **Friends.** The other half of the plan. It fits as
  `internal/domain/friend.go` + a `FriendStore` + `internal/api/friends.go`,
  routed the same way. Note the plan's point that friend notifications are
  addressed to a *user*, not a conversation — the hub would need a room keyed
  by user id, which `Join` already supports (any string is a valid room).
- **Cross-service presence.** The plan has each service keep a Redis *set* of
  its live connection ids and publish to `presence:changed`, with the
  games-service aggregating and serving `/presence`. `Hub.ClientCount` is the
  local number that would feed that; the Redis client and pub/sub are not here.
- **Conversation membership.** `conversationId` is an opaque string; there is
  no conversations table and no check that a sender belongs to one. That is
  the natural next table once auth exists.
