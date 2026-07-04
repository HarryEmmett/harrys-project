# Harry's Project — Current State & Plan

Started as a Slido clone; it's now a small social app: live Q&A (questions +
per-question chat), a friends panel, direct messages, profiles, likes, and
presence. NestJS + socket.io backend, React + TanStack Router/Query + zustand
frontend, shared zod schemas in `shared/`.

## Current state

### What works
- **REST reads, end to end**: `/questions`, `/questions/:id`, `/questions/:id/chat`,
  `/friends`, `/messages/:friendId`, `/likes`, `/page-visits` — all validated with
  shared zod schemas on both sides. Everything is read-only mock JSON except likes.
- **UI**: routes for `/`, `/question/$id`, `/message/$id`, `/profile/$id` are all
  real pages now (no stubs left). Questions list with create/vote/delete, question
  detail with live-chat panel, friends panel with add-friend modal, message threads
  with reply box, profile pages, dark/light theme.
- **LikesService** is the one feature with real server-side state: in-memory count
  seeded from JSON at boot, `incrementLikes()`, and a `/likes` gateway that pushes
  the count on connect and rebroadcasts on every like.

### The core architectural problem: all writes are an illusion
Every interactive feature uses the same copy-pasted pattern
(`Questions.tsx`, `FriendsPanel.tsx`, `MessageThread.tsx`, `QuestionChat.tsx`):

1. Fetch once via react-query, copy into local `useState` guarded by an
   `isInitializedRef` so it never re-syncs.
2. All mutations (create question, vote, delete, add friend, send message, post
   chat, upvote) only touch that local state.

The server has **zero write endpoints** (except the unused likes gateway). Nothing
persists, nothing syncs between clients, and a refresh discards everything. Fixing
this one pattern is most of the roadmap.

### Dead / disconnected code
- `useRoom.ts` — the entire questions websocket round-trip (join room, post
  question, merge broadcasts into the query cache) is **imported by nothing**.
  `Questions.tsx` went local-state instead. `QuestionsGateway` on the server is
  correspondingly unreachable from the UI.
- `useOnlineCount.ts` — connects to the **default** namespace (no gateway there)
  and listens for `clientOnlineAck`, which no server code emits. The header's
  "Online Users" is permanently 0. The gateways actually emit `onlineCount:update`
  (on `/presence`) and `onlineQuestionsCount:update` (on `/questions`).
- `usePageVisitsQuery.ts` + `/page-visits` endpoint — no consumer.
- Likes: server is done (REST + gateway) but **no UI component uses it** — there's
  no `useLikesQuery` and nothing connects to `/likes`.
- `@nestjs/typeorm` is installed but never imported.

### Known bugs (updated — old list was stale)
- [x] ~~`Questions.tsx` key uses `q.id + Math.random()`~~ — already fixed, keys by `question.id`.
- [ ] `useOnlineCount` dead listener (see above) — bug still exists but has changed
  shape since the old plan: wrong namespace **and** wrong event name now.
- [ ] Presence double-counting: `UserPresenceService` counts *connections per
  namespace*, so one user on two namespaces counts twice in `getTotalOnlineCount()`.
- [ ] `useRoom` double-disconnect: both effects' cleanups call `socket.disconnect()`
  (moot while dead, fix when resurrecting).
- [ ] `MessageThread` stores `sentAt` as a locale time string while the schema/mock
  use ISO timestamps — will bite as soon as messages persist.

## Roadmap

Ordering principle: make writes real on the server first (cheap, unblocks
everything), then swap the UI's local-state pattern for real mutations one feature
at a time, then add realtime where it earns its keep. LikesService is the template
for phase 1 — it already does in-memory-store-seeded-from-JSON correctly.

### Phase 0 — Delete or decide (small, do first)
- Fix `useOnlineCount`: connect to `/presence`, listen for `onlineCount:update`,
  read `total` from the payload. Fix the double-count in `UserPresenceService`
  (track socket ids per namespace in a `Map<string, Set<string>>`, or count unique
  clients) while you're in there.
- Decide likes' fate: either add a like button (Footer or Header) wired to the
  existing `/likes` gateway — a nice tiny end-to-end realtime win — or delete the
  module. Same for `/page-visits`: use it or remove it.
- Delete `useRoom.ts` for now (git keeps it); phase 3 rebuilds it properly. Keeping
  dead realtime code around just confuses every later change.

### Phase 1 — Real writes on the server (in-memory stores)
Convert each service from read-file-per-request to the LikesService pattern: load
mock JSON once in the constructor, hold state in memory, expose mutations. Add REST
write endpoints, with request-body zod schemas added to `shared/apiSchema.ts`
(create-question, vote, delete, add-friend, send-message, post-chat):
- `POST /questions`, `POST /questions/:id/vote`, `DELETE /questions/:id`
- `POST /questions/:id/chat`, `POST /questions/:id/chat/:chatId/vote`
- `POST /friends`, `POST /messages/:friendId`
Server generates ids and timestamps (never trust client ids — `Questions.tsx`
currently invents `q${n}` ids that will collide with mock data and other clients).
DB comes in phase 5; don't block on it.

### Phase 2 — Real mutations in the UI
Feature by feature (questions → chat → friends → messages), replace the
local-state-copy pattern with `useMutation` + query invalidation (or
`setQueryData` for optimistic updates). Delete the `isInitializedRef` hydrate-once
blocks — react-query's cache becomes the single source of truth again. After this
phase, refresh/multi-tab behave correctly even before websockets return.

### Phase 3 — Realtime where it matters
- Questions + question chat are the features that want live sync (that's the Slido
  part). Rebuild `useRoom` against the `/questions` gateway: room per question id
  for chat, a global room for the questions list; gateway handlers call the same
  store services as REST so both paths agree; broadcast writes into rooms and merge
  into the query cache client-side (the old useRoom merge logic was right — reuse it).
- Send full-state snapshot on room join so late joiners aren't missing history.
- Friends/messages can stay REST-only until there's a second real user; don't
  build DM websockets speculatively.

### Phase 4 — Identity
- Anonymous persistent user id + display name in localStorage, sent with every
  write; replaces the hardcoded `user_me` / `'You'` author fields.
- `Profile.tsx` `me` placeholder becomes real data. Host-vs-attendee roles
  (mark-answered, delete-any-question) ride on this if the Slido direction continues.

### Phase 5 — Real persistence
- Swap in SQLite via the already-installed `@nestjs/typeorm` (or drop it for
  Prisma/drizzle — but decide, and remove the unused dep if not TypeORM).
  Store interfaces from phase 1 mean only the service internals change.

### Phase 6 — Tests & tooling
- There are currently **no tests and no test runner** in any package (`server`'s
  `build` script is also wrong — it runs `node dist/...` instead of `nest build`; fix that).
- Add vitest: unit tests for the store services (phase 1 made them pure and
  testable), supertest e2e for the REST write paths, and a couple of
  react-testing-library tests for the mutation hooks.
- Do this after phase 2, not last-last — phases 3–5 are much safer with the write
  paths under test.
