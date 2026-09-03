-- Schema for the messages-service's own database.
--
-- This service owns these tables; it does not share the games-service's
-- (shared/schema.md). Apply with:
--
--   psql "$DATABASE_URL" -f internal/store/postgres/schema.sql
--
-- Unlike the games-service, there is no TypeORM `synchronize: true` doing this
-- on boot — the file is the source of truth, and it is idempotent so re-running
-- it is safe.

CREATE TABLE IF NOT EXISTS messages (
    id              uuid        PRIMARY KEY,
    conversation_id text        NOT NULL,
    sender_id       text        NOT NULL,
    content         text        NOT NULL,
    sent_at         timestamptz NOT NULL DEFAULT now()
);

-- Serves the only read path: one conversation's history, newest first, paged
-- by a sent_at cursor.
CREATE INDEX IF NOT EXISTS messages_conversation_sent_at_idx
    ON messages (conversation_id, sent_at DESC, id DESC);
