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
- ~~No quiz-submit endpoint exists~~ **Done (2026-07-13):**
  `POST /games/:id/submit` and the `correctOptionIndex` column are
  implemented; `/game/:id` is a playable quiz with answer selection and a
  score screen (roadmap item 1).

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
- [x] **Vote lost-update race.** Fixed (2026-07-13): `voteGame` now uses
  atomic `gameRepo.increment({ id }, 'votes', delta)` and re-fetches for the
  response/broadcast.
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
- ~~`fetchData` status check / "mock data" message~~ fixed 2026-07-13.
- ~~`voteGameMutation` has no `onError` handling~~ fixed 2026-07-13
  (re-syncs the games cache on failure).
- The hub re-sorts by votes on every live update, so tiles jump under the
  cursor mid-click. Consider sorting only on load, or a stable sort with a
  "sort by votes" control.
- ~~`toQuizQuestionResponse` loads the full `game` relation~~ fixed
  2026-07-13: `QuizQuestionEntity` now declares the `gameId` FK column.
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

## What's missing → technology choices

Everything the target architecture needs that doesn't exist yet, with a
concrete pick for each. Bias: boring, already-in-the-stack tools (NestJS,
Postgres, socket.io, zod) over new moving parts; each pick notes the roadmap
phase that forces it.

### Redis — presence, pub/sub, and cross-service cache (phase 4, adopt earlier if useful)
The one genuinely new piece of infrastructure, and it covers three jobs:
- **Cross-service presence** (required): per-service Redis *sets* of live
  socket ids + a `presence:changed` pub/sub channel, aggregated by the
  games-service which keeps sole ownership of the `/presence` namespace —
  the design already in `friends-messages-service-plan.md`. `ioredis` is
  already a `server/` dependency; reuse it in the messaging service.
- **Cache across microservices**: `@nestjs/cache-manager` with a Redis store
  in each service for hot, shared-by-everyone reads — the game list, forum
  post list, resolved profiles — invalidated on write via the same pub/sub
  channels. One rule: Redis cache is a *per-service private optimization*,
  not a data-sharing backdoor. If service B needs service A's data, it calls
  A's REST API (and may cache the response); it never reads A's cache keys
  or tables directly, otherwise the cache becomes an undocumented contract.
- **Socket.io horizontal scaling** (later, only if a service runs >1
  instance): `@socket.io/redis-adapter` so room broadcasts reach sockets
  connected to other instances. Not needed at one instance per service —
  but it's the same Redis, so the path is already paved.

### Messaging service runtime (phase 4)
Same stack as `server/`: NestJS + socket.io + TypeORM/Postgres, own schema.
Consistency beats novelty here — the layering rules, zod pipes, and gateway
patterns transfer verbatim. Formalize the repo as **npm workspaces**
(`server`, `ui`, `shared`, `services/messaging`) to replace the ad-hoc
symlink; same mechanism, declared properly. Turborepo/Nx only if task
orchestration ever actually hurts.

### Auth (phase 5)
Self-built NestJS auth-service: `@nestjs/passport` + `passport-jwt`,
`argon2` password hashing, short-lived access token + refresh token.
Sockets authenticate via the JWT in the socket.io handshake (`auth` payload),
validated in a gateway guard. Each service verifies JWTs locally with the
shared public key (RS256) — no per-request call to the auth-service. A
managed provider (Clerk/Auth0/Supabase) is the faster alternative if
building auth stops being interesting; the JWT-verification seam in the
other services is identical either way, so this choice can be deferred.

### Database migrations (phase 4 at the latest, ideally phase 0/1)
TypeORM migrations (`migration:generate`/`migration:run`) replacing
`synchronize: true`. Non-negotiable once two services own separate schemas —
`synchronize` + multiple deployables is how tables get silently mangled.
Seed/clear scripts stay raw `pg`, per the `schema.md` rationale.

### Local dev orchestration (any time, cheap win)
`docker-compose.yml` at the repo root: Postgres + Redis + (eventually) both
services, plus a committed `.env.example`. Kills the "works on my machine"
setup and is a prerequisite for onboarding anyone else — right now the DB is
hand-configured and `.env` was committed to compensate (see bug list).

### Abuse control (phase 2, when writes open up)
`@nestjs/throttler` on write endpoints — votes today are unlimited and
anonymous; forum posts/replies (phase 2) and messages (phase 4) are
free-text writes with no identity behind them. Per-IP throttling is the only
lever until auth lands, then per-user limits replace it.

### Testing (start phase 1, grow with each phase)
- Services: Jest + `supertest` for controller/e2e tests (Nest's default
  harness), against a docker-compose Postgres.
- UI: Vitest + React Testing Library (Vite-native, so no extra config).
- Cross-service smoke (once messaging exists): a small Playwright suite —
  the browser is already provisioned in CI-like environments — covering
  vote sync and message delivery end-to-end.

### CI (any time)
GitHub Actions: lint + typecheck + tests per workspace on PR; add the
Playwright smoke job when it exists. Nothing exotic.

### Deliberately NOT adopting yet
- **Kafka/RabbitMQ** — Redis pub/sub covers presence + cache invalidation at
  this scale; a broker earns its place only when events need durable replay
  or consumer groups.
- **API gateway / BFF** — two services, one SPA, env-var URLs suffice;
  revisit with auth (token refresh, rate limiting in one place).
- **Kubernetes** — docker-compose until there's more than one machine.
- **GraphQL** — the zod-typed REST contract in `shared/` already gives
  end-to-end types; a second query language would duplicate it.

## Where games live (and keeping the UI from bloating)

Two separate questions: where a game's *logic* runs, and where its *code* is
packaged.

### Logic: split by trust, not by habit
- **Catalog is always backend.** Every game — however client-side — gets a
  `games` row (title, description, `gameType`, votes) so it's a hub tile.
- **Content is backend when it's secret or shared.** Quiz questions live in
  Postgres because `correctOptionIndex` must never reach the client (hence
  server-side scoring in `POST /games/:id/submit`). A snake/memory-style
  game has no secret content — its "content" is just code.
- **Solo/casual games run entirely in the UI** and send small result
  payloads ("finished, score 42") to a per-type endpoint. Cheap, no latency
  concerns.
- **Anything competitive or shared is server-authoritative** — a
  client-submitted score is forgeable with a single `curl`. Leaderboards,
  rewards, and phase-6 multiplayer sessions mean: server owns rules/state
  (rooms on the `/games` namespace), clients send *inputs*, server
  broadcasts resulting state.

Rule of thumb: **the client sends what the user did; the server decides what
it means** — whenever the meaning matters to anyone else. Until auth
(phase 5), client-reported solo scores are fine but explicitly untrusted.

### Packaging: a ladder, climbed per game as needed
1. **Lazy-loaded feature folders (start here).** Each game in
   `ui/src/features/games/<gameType>/`, mounted via
   `React.lazy(() => import(...))` — Vite chunk-splits automatically, so a
   game's code only downloads when opened. The shell bundle stays flat no
   matter how many games exist. One line of ceremony per game.
2. **Workspace packages.** Once npm workspaces are formalized, a game that
   pulls in heavy deps (physics/game engine) becomes its own package
   (`packages/games/<name>`) so those deps stay quarantined. Same runtime
   behavior as rung 1.
3. **Iframe + postMessage SDK (the real games-platform answer).** How
   Discord Activities / Facebook Instant Games / Poki work: each game is a
   self-contained static bundle (any tech — Phaser, Unity WebGL, Godot) on
   a CDN, loaded in a sandboxed `<iframe>`, talking to the host via a tiny
   SDK (`ready`, `finish(result)`, `getSession()`). The `games` row grows an
   `entryUrl`; games deploy independently and the shell never grows. Adopt
   only when a game outgrows the React bundle (real engine, or third-party
   games).
4. **Module federation / micro-frontends — not for this project.** It exists
   so multiple *teams* can release independently inside one seamless UI;
   for one developer it's configuration pain with no payoff over rung 3.

Cheap move now that keeps every door open: define a small `GameSDK`
interface (`mount(el, context)` / `onFinish(result)`) and make even in-repo
games talk to the shell only through it. A game's home (bundle chunk →
package → CDN iframe) then becomes a per-game packaging decision, not a
rewrite, and `gameType` naturally evolves into a manifest
(`kind: 'builtin' | 'embedded'` + `entryUrl`).

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

### 1. Quiz play-through (finish what's half-specced) — DONE 2026-07-13
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
