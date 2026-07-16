# Slido Clone — Progress & Planth the current-state summary, known bugs, and the 7-phase roadmap we discussed. Let me know when you want to start on a

## Current state

### Backend (NestJS)
- `QuestionsModule`: REST GETs for `/questions`, `/page-visits`, `/likes` — all reading static mock JSON off disk on every request. No writes, no DB.
- `QuestionsGateway` (`/questions` namespace): join/leave room, and a `questions-added` handler that just re-broadcasts to the room. It never persists 
the question anywhere — the mock JSON file backing the REST endpoint is untouched.────────────────────────────────────────────────────────────────────────────
- `UserPresenceModule`: in-memory `Map<namespace, count>`, tracked per-socket-namespace, wired into both `/presence` and `/questions` gateways.
- `eventSchema` exists in the shared schema but isn't used anywhere — there's no concept of a specific event/room with its own data yet; everything is 
one global mock dataset.

### Frontend
- Router has `/`, `/question/$id`, `/message/$id` — the latter two are stub placeholder pages, not wired to anything.
- `useQuestionsQuery`/`useLikesQuery`/`usePageVisitsQuery` pull the static mock data via react-query.
- `useRoom` connects to `/questions`, joins a hardcoded room, and `postQuestion` sends a hardcoded fixed payload (no text input yet).
- `useOnlineCount` only opens a socket to `/presence`, but also registers a listener for `onlineQuestionsCount:update` — that event is only ever emitted
on the `/questions` namespace, so that handler will never fire.
- `Questions.tsx` keys list items with `q.id + Math.random()` (with an eslint-disable) — forces a remount every render; should just be `q.id`.

**Summary:** the plumbing works (REST + shared zod schema + websocket round trip) but almost none of the actual Slido feature set exists yet, and there
's no real data layer — new questions only live in whichever connected clients' local react-query cache happened to receive the broadcast; a refresh or
a new joiner loses them.

## Known bugs to fix
- [ ] `useOnlineCount` connects only to `/presence` but listens for a `/questions`-only event (`onlineQuestionsCount:update`) — dead listener.
- [ ] `Questions.tsx` list key uses `q.id + Math.random()` — remove the `Math.random()`, just use `q.id`.
- [ ] Websocket-posted questions are never persisted server-side — only broadcast to currently connected room members.

## Roadmap

### 1. Real data layer
- Replace static-JSON reads with an in-memory `EventsStore`/`QuestionsStore` service (per-event, keyed by room/event id) that the gateway actually writes
to and the REST controller reads from. Prerequisite for everything else. DB (SQLite/Postgres + Prisma) can come later once the shape is proven.

### 2. Events & rooms
- Use the existing `eventSchema`: endpoint to create an event, generates a room/join code; `/question/$id` route becomes the real per-event view instead
of a stub.

### 3. Questions feature complete
- Real submit form (replace hardcoded payload), upvote, mark-answered (host-only), sort by votes, full-list sync on join (not just appends).

### 4. Presence cleanup
- Consolidate `/presence` vs `/questions` online-count logic (currently split across two gateways/namespaces in a way that half-fires), fix the `useOnlin
eCount` namespace mismatch bug.

### 5. Identity/roles
- Anonymous user id persisted client-side (localStorage), host vs attendee distinction for who can create events / mark answered.

### 6. Polish
- Join-by-link/code UI, styling pass, remove the `Math.random()` key hack.

### 7. Tests + real DB
- Add test coverage once behavior is settled, then swap the in-memory store for a real DB.
