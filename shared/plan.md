# Plan v2 — Discord-style app: Game Hub + Forums + Messaging

Supersedes the v1 "Game Hub — Progress & Roadmap" plan (which itself replaced
the Slido plan, now archived in `shared/legacy-slido-questions/slido-plan.md`).

The product direction: a Discord-style app. This repo's `server/` is the
**games service** (game hub + quizzes + forums + presence). Friends, live
messages, and (probably) profiles are a **separate messaging microservice**
that does not exist yet — see `shared/friends-messages-service-plan.md` for
its detailed design. An auth service comes after that; until then there is no
real identity anywhere.

## Current state (verified against the code, 2026-07-10)

### Backend (`server/`, NestJS + Postgres/TypeORM)
- `GamesModule`: `GET /games`, `GET /games/:id`, `GET /games/:id/questions`,
  `PATCH /games/:id/vote`. Games/questions are seed-only, no create flow.
- `GamesGateway` (`/games` namespace): global `games-updated` broadcast on
  vote. No rooms.
- `UserPresenceModule`: in-memory per-namespace counter, broadcast over
  `/presence`.
- **No forum module exists**, even though `shared/apiSchema.ts` already has
  forum post/reply schemas, `shared/constants.ts` has `FORUM_POSTS_ENDPOINT`
  + forum query keys, and the seed script tries to insert forum posts.
- **No quiz-submit endpoint exists**, even though `shared/apiSchema.ts` has
  `submitQuizAnswers*` schemas and `shared/schema.md` documents
  `POST /games/:id/submit` and a `correctOptionIndex` column as if built.

### Frontend (`ui/`, React + TanStack Router/Query)
- `/` game hub grid (live vote sync via socket → react-query cache), and
  `/game/:id` read-only quiz view. This slice is real and wired to the API.
- `FriendsPanel`, `/message/:id`, `/profile/:id`: mock-data placeholders for
  the future messaging service. No forum UI at all.

### Shared (`shared/`)
- Zod wire schemas + constants consumed by both sides — this is the contract
  layer and should stay dependency-light (no TypeORM, see `schema.md` for the
  symlink/metadata rationale).
- `seedDb.ts` / `clearDb.ts` talk to Postgres via raw `pg`.

## Known bugs (fix these before/while building new features)

Ordered roughly by severity.

- [ ] **Committed DB credentials.** `.env` (DB host/user/password) is tracked
  in git, while `schema.md` claims it's gitignored. There is no root
  `.gitignore`. Fix: `git rm --cached .env`, add a root `.gitignore`, add a
  `.env.example`, and rotate the DB password (it's in history).
- [ ] **Seed/clear scripts crash against the real schema.**
  `seedDb.ts` inserts a `correctOptionIndex` column that `QuizQuestionEntity`
  doesn't declare (so `synchronize` never creates it), and both scripts touch
  a `forum_posts` table that has no entity anywhere — the table doesn't
  exist. The scripts, `schema.md`, and the entities must move together:
  either add the `correctOptionIndex` column + forum entities (roadmap items
  1–2 below) or trim the scripts back until then.
- [ ] **Online count double-counts every user.** Each browser tab opens two
  sockets — `/games` (`GamesSync`) and `/presence` (`useOnlineCount`) — and
  `getTotalOnlineCount()` sums all namespaces, so 1 person shows as 2.
  Decide what "online" means (probably: unique clients on `/presence` only,
  or dedupe by a client id) instead of summing per-namespace connection
  counts.
- [ ] **`useOnlineCount` hardcodes `http://localhost:3000/presence`** instead
  of using `apiUrl` (`VITE_API_URL`) like the games socket does — presence
  silently breaks on any non-local deployment.
- [ ] **Vote lost-update race.** `GamesService.voteGame` does
  read → `votes += delta` → save. Two concurrent votes read the same row and
  one increment is lost. Use an atomic
  `gameRepo.increment({ id }, 'votes', delta)` (then re-fetch for the
  response/broadcast).
- [ ] **`MessageThread` shows the wrong conversation after navigation.**
  It copies query data into local `useState` guarded by a one-shot
  `isInitializedRef`; navigating `/message/friend-1 → /message/friend-2`
  re-renders the same component instance (TanStack Router doesn't remount on
  param change), the ref stays `true`, and friend-1's messages render under
  friend-2's header. Placeholder code, but if it survives until the
  messaging service: render from the query cache directly (no state copy),
  or key the component by `id`. `FriendsPanel` uses the same copy-into-state
  pattern; its added friends also silently vanish on cache refetch.
- [ ] **Presence counter can drift.** The in-memory counter has no socket-id
  tracking; a missed disconnect skews it until restart. Fine for now —
  the Redis socket-id **set** design in the friends/messages plan replaces
  it when the second service arrives; don't invest in the counter further.

Smaller cleanups, do opportunistically:
- `fetchData` checks `res.status !== 200` — dead code, axios throws on
  non-2xx. Its error message still says "mock data".
- `voteGameMutation` has no `onError` handling — a failed vote fails
  silently.
- The hub re-sorts by votes on every live update, so tiles jump under the
  cursor mid-click. Consider sorting only on load, or a stable sort with a
  "sort by votes" control.
- `toQuizQuestionResponse` loads the full `game` relation just to read
  `game.id` — select the `gameId` FK column instead.
- `gameType: game.gameType as 'quiz'` cast: fine while one type exists, but
  the zod `.strict()` parse will start throwing at runtime the moment a
  second type is seeded — replace with the planned enum when item 3 lands.
- `synchronize: true` + no migrations — acceptable in dev, must become
  TypeORM migrations before anything production-like (and it's required
  anyway once two services own separate schemas).

## Doc drift to resolve

`schema.md` describes `correctOptionIndex` and `POST /games/:id/submit` as
existing; neither is implemented. Either implement them (roadmap item 1) or
mark those sections as planned. Keep docs describing the code that exists,
with plans living here.

## Target architecture

```
ui/  (React SPA)
 ├── REST + WS ──► games-service (this repo's server/)
 │                  ├── GamesModule      (hub, quizzes, votes, scoring)
 │                  ├── ForumModule      (posts, replies)          [new]
 │                  └── PresenceModule   (owns /presence endpoint)
 │                        ▲ aggregates via Redis sets + pub/sub
 └── REST + WS ──► messaging-service (new repo dir, e.g. services/messaging)
                    ├── FriendsModule    (friend list, add/remove)
                    ├── MessagesModule   (conversations, live chat WS)
                    └── ProfilesModule   (see decision below)
                    └── contributes presence into Redis

shared/  = contract layer only: zod wire schemas, constants, seed scripts.
           No TypeORM, no Nest — each service owns its entities and DB schema.

auth-service (later) — issues identity (JWT); both services validate it.
```

Principles:
- **`shared/` is the API contract, not shared runtime.** Every request/
  response shape lives in `apiSchema.ts`, parsed with zod on both ends
  (this already works well — keep it). Split it per-domain as it grows
  (`apiSchema/games.ts`, `forum.ts`, `messaging.ts`) with a barrel export.
- **Each service owns its data.** Separate Postgres schemas (or databases);
  no cross-service table access. Cross-service reads happen over HTTP/events,
  not SQL.
- **Realtime stays namespaced per service.** games-service keeps `/games`
  and `/presence`; messaging-service runs its own socket.io server for
  `/messages` (rooms keyed by `conversationId`). The frontend's presence
  contract doesn't change: it keeps connecting only to games-service's
  `/presence`, which aggregates all services' counts from Redis (design
  already detailed in `friends-messages-service-plan.md` — build that, it's
  right).
- **Controller → service → gateway layering** (persist first, broadcast the
  service's return value, never the raw request body) — already the house
  rule, applies to forums and messaging too.
- **Frontend: server state lives in react-query, full stop.** The
  socket-writes-into-query-cache pattern (`useGamesSocket` +
  `updateGameInCache`) is the template for forums and messaging. Kill the
  copy-into-`useState` pattern in the placeholder components when they're
  rebuilt. As features multiply, group by feature
  (`ui/src/features/{games,forum,messaging}/` with their own hooks/
  components) instead of the flat `components/` + `hooks/` folders.
- **No API gateway yet.** Two services and one SPA don't need one — give the
  UI `VITE_GAMES_API_URL` and `VITE_MESSAGING_API_URL`. Revisit (BFF or
  gateway) only when auth lands and cross-cutting concerns (token refresh,
  rate limiting) appear.

### Decision: profile service
Recommendation: **don't make profiles a third service now.** Profile data
(name, email, bio, online flag) is small, and its only consumers are the
friends list and the profile page — the same service that owns friends.
Build it as a `ProfilesModule` inside the messaging service with its own
tables and its own routes (`/profiles/:id`), so it has a clean seam to be
extracted into (or absorbed by) the auth service later if it grows real
weight (avatars, settings, presence prefs). A third deployable today buys
operational cost and cross-service joins for no benefit.

## Roadmap

### 0. Stabilization pass (before new features)
Fix the bug list above — at minimum: `.env` untracked + password rotated,
seed/clear scripts consistent with entities, presence double-count,
hardcoded presence URL, atomic votes.

### 1. Quiz play-through (finish what's half-specced)
Add `correctOptionIndex` to `QuizQuestionEntity` (never serialized to the
client), implement `POST /games/:id/submit` exactly as `schema.md` and
`submitQuizAnswers*` schemas already describe (stateless scoring, unanswered
counts as wrong, no broadcast). UI: answer selection on `/game/:id`, submit,
score/result screen. This turns the read-only quiz into an actual game and
un-breaks the seed script's `correctOptionIndex` insert.

### 2. Forums (games-service)
The contract already exists (`forumPost*`/`forumReply*` schemas,
`FORUM_POSTS_ENDPOINT`, query keys, seed data) — build to it:
- `ForumModule`: `ForumPostEntity`, `ForumReplyEntity` (post 1──< replies,
  cascade delete), REST per the schemas: list/get/create/update/delete
  posts, list/create replies.
- `author` stays a free-text string until auth exists (mirrors the plan for
  messages' `senderId` — don't invent fake identity).
- UI: `/forum` list + create form, `/forum/:postId` detail + replies. Add a
  header nav link alongside Game Hub.
- Live updates are optional here; if wanted, a `/forum` namespace with a
  room per post id, same layering as games. Start REST-only.
- Un-breaks the seed/clear scripts' `forum_posts` statements; add
  `forum_replies` to both scripts.

### 3. Second game type
Use the `gameType` discriminator for real: change `gameSchema.gameType` to
an enum, make the hub render per-type detail routes, and find the seam
between generic `GamesService` behavior (list/vote) and per-type modules
(quiz questions/scoring vs. the new type's needs).

### 4. Messaging microservice (friends + live messages + profiles)
Scaffold `services/messaging` as its own NestJS app per
`friends-messages-service-plan.md`, including the Redis presence
aggregation. Resolve that doc's open questions with what we now know:
- Friend add: instant-add for v1 (no auth to gate a request/accept flow on);
  revisit after auth.
- `senderId`: until auth, use a client-generated persistent id
  (localStorage) — explicitly temporary, replaced by JWT subject later.
- Conversations: use `conversationId` from day one (cheap now, enables
  groups later).
- Profiles: `ProfilesModule` inside this service (decision above).
Replace the UI mock hooks (`useFriendsQuery`, `useMessagesQuery`) with real
calls + a `/messages` socket writing into the query cache; rebuild
`MessageThread`/`FriendsPanel` off the query cache (fixes their bugs by
deletion).

### 5. Auth service + identity rollout
Real identity (JWT), then: friends request/accept flow, `senderId` from
token, per-user vote limits (one vote per user per game), forum authorship,
persisted quiz attempts/leaderboards. Sequenced last deliberately — items
1–4 are all buildable anonymous-first.

### 6. Game sessions ("play with friends")
The Discord-esque payoff: invite a friend from the friends list into a live
game session (room per session, shared quiz progress). Needs 4 + 5 first.
Deliberately not designed further yet.
