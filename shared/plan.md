# Game Hub — Progress & Roadmap

The app was a "Slido clone" (live Q&A). It's now becoming a Discord-style hub
where users can play games, solo or with friends. The old Slido feature was
retired and archived to `shared/legacy-slido-questions/` (its former roadmap
doc is there too, as `slido-plan.md`) — the messaging/friends sidebar remains
a UI-only placeholder for a separate future service, untouched by this work.

## Current state

### Backend (NestJS)
- `GamesModule` (`server/src/games/`): Postgres/TypeORM-backed. `GET /games`,
  `GET /games/:id`, `GET /games/:id/questions`, `PATCH /games/:id/vote`.
  No create/delete — games and their quiz questions are seed-only.
- `GamesGateway` (`/games` namespace): flat global broadcast of
  `games-updated` on vote. No rooms/join-leave — there's no per-question
  chat/reply feature and no create flow, so nothing needs scoping.
- `UserPresenceModule`: unchanged, still a simple cross-namespace online
  count.

### Frontend
- `/` (`GameHub`) renders a tile grid from `GET /games`, sorted by votes,
  each tile upvotable/downvotable in place.
- `/game/:id` (`QuizDetail`) shows the game's quiz questions with their
  multiple-choice options as **read-only** content — no answer selection,
  no scoring yet.
- `/message/:id`, `/profile/:id`, and the `FriendsPanel` sidebar are
  untouched mock-data placeholders (see `shared/friends-messages-service-plan.md`).

## Known simplifications
- Exactly one game exists today (a general-knowledge quiz), seeded via
  `shared/scripts/seedDb.ts`. The hub grid is data-driven (not hardcoded to
  one tile) so more games can be added later without a layout change.
- Voting is whole-game only (`games.votes`) — there's no per-question vote or
  answer tracking.
- No identity/session concept — same as the old Slido app, everyone sees one
  shared, live-updating list.

## Roadmap

### 1. Hub + one read-only quiz (this pass)
Retire Slido, ship the game hub UI, one seeded quiz game with read-only
multiple-choice questions, whole-game upvoting. Done.

### 2. Per-question guessing/scoring
Let a user pick an answer per quiz question; track/tally guesses; decide
whether questions need a "correct answer" column or whether this stays
opinion-poll-style (most popular answer, no right/wrong).

### 3. Additional game types
Use the `games.gameType` discriminator to add a second game kind to the hub;
figure out what part of the `GamesService`/`GamesGateway` layer generalizes
vs. what needs a per-type sub-module.

### 4. Solo-or-with-friends
The long-term vision: invite friends into a specific game session once the
Friends/Messages service (see `shared/friends-messages-service-plan.md`) is
real. Needs an actual session/room concept — deliberately not built yet.
