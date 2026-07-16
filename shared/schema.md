# Database schema

Postgres, accessed via TypeORM. The entity classes are the source of truth
for the schema (`synchronize: true`, no migrations yet — the tables below
are generated automatically from these classes on server boot).

**Entities live in `server/src/games/entities/`, not here in `shared/`.**
`server` consumes `shared` through an npm symlink with its own independent
`node_modules`. If TypeORM entity classes lived in `shared`, they'd be
decorated using `shared`'s copy of `typeorm`, while Nest in `server` would
query metadata using `server`'s separate copy — two different module
instances, so TypeORM would silently fail to find the entity metadata. Keeping
entities in `server` avoids that; `shared/scripts/seedDb.ts` and
`shared/scripts/clearDb.ts` talk to Postgres directly via raw `pg` instead of
importing these entities, for the same reason.

## Tables

### `games`

One row per game shown as a tile in the Game Hub (`/`). `gameType` is a
discriminator for future game types — only `'quiz'` exists today.

| Column        | Type          | Constraints                  |
| ------------- | ------------- | ----------------------------- |
| `id`          | `uuid`        | PK, default `uuid_generate_v4()` |
| `title`       | `varchar`     | not null                      |
| `description` | `varchar`     | not null                      |
| `gameType`    | `varchar`     | not null (e.g. `'quiz'`)      |
| `votes`       | `int`         | not null, default `0`         |
| `createdAt`   | `timestamptz` | not null, default `now()`     |

Relations: has many `quiz_questions` (`ON DELETE CASCADE`).

### `quiz_questions`

Multiple-choice questions belonging to a quiz-type `game`, rendered as
read-only content on the game's detail page (`/game/:id`).

| Column               | Type          | Constraints                       |
| -------------------- | ------------- | ----------------------------------- |
| `id`                 | `uuid`        | PK, default `uuid_generate_v4()`  |
| `prompt`              | `text`        | not null                          |
| `options`            | `text[]`      | not null — ordered MCQ option strings |
| `correctOptionIndex` | `int`         | not null — index into `options`   |
| `createdAt`          | `timestamptz` | not null, default `now()`         |
| `gameId`             | `uuid`        | FK → `games.id`, `ON DELETE CASCADE` |

`correctOptionIndex` is internal-only — never exposed via `quizQuestionSchema`
(same "not serialized to the client" treatment as `gameId`), otherwise the
answer would leak before submission. It's only read server-side by
`GamesService.submitQuizAnswers`.

## Relations at a glance

```
games (1) ──< quiz_questions
```

## API-facing shapes vs. DB shapes

The zod schemas in `shared/apiSchema.ts` are the wire format the frontend and
backend agree on — they're a subset of the entity columns (internal-only
columns like `gameId` foreign keys are never serialized back to the client):

| Zod schema (`apiSchema.ts`) | Backed by entity      | Fields *not* exposed |
| ---------------------------- | ---------------------- | --------------------- |
| `gameSchema`                  | `GameEntity`            | —                      |
| `quizQuestionSchema`          | `QuizQuestionEntity`    | —                      |

`GamesService` (`server/src/games/games.service.ts`) does this mapping
explicitly (`toGameResponse`/`toQuizQuestionResponse`) rather than serializing
entities directly, since TypeORM relations would otherwise leak into the
response and the zod `.strict()` parse would reject them.

## Scoring

`POST /games/:id/submit` (`GamesService.submitQuizAnswers`) is stateless — no
attempt/result is persisted anywhere, and there's no per-user identity to tie
it to yet. It takes `{ answers: { questionId, selectedOption }[] }`, scores
every quiz question belonging to the game (an unanswered question just counts
as incorrect), and returns `{ results: { questionId, correct }[], score,
total }` in one response. No websocket broadcast — a score is only relevant
to the person who submitted it.

## Seeding and resetting

- `npm run db:seed` (from `shared/`) — creates one quiz game and 5 hardcoded,
  readable trivia questions with their correct answers
  (`shared/scripts/seedDb.ts`, raw `pg`).
- `npm run db:clear` (from `shared/`) — deletes all rows from both tables,
  children before parents (`shared/scripts/clearDb.ts`).
- Both connect using `DB_HOST`/`DB_PORT`/`DB_USERNAME`/`DB_PASSWORD`/`DB_NAME`
  from the repo-root `.env` (gitignored).

## Known simplifications

- `synchronize: true` — schema changes apply automatically on server boot.
  No migrations yet; fine for now, not for production.
- Single seeded quiz game, no create-game flow — games and quiz questions are
  seed-only for now (see `shared/plan.md`).
- Scoring is stateless (see above) — no per-user attempt history yet, so a
  score can't be looked up later or attributed to anyone.
