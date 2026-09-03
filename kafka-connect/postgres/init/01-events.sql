-- Runs once, the first time the postgres volume is created.
-- This is the table you will hand-edit to produce events.

CREATE TABLE IF NOT EXISTS public.events (
    id          BIGSERIAL PRIMARY KEY,
    event_type  TEXT        NOT NULL,
    user_id     TEXT,
    message     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REPLICA IDENTITY FULL makes Postgres write the *entire old row* into the WAL
-- on UPDATE and DELETE, not just the primary key. Debezium then gives you a
-- complete "before" image, which is much easier to learn from.
-- (In production this costs WAL volume; DEFAULT is usually the right choice.)
ALTER TABLE public.events REPLICA IDENTITY FULL;

-- A couple of rows so the initial snapshot has something to carry.
INSERT INTO public.events (event_type, user_id, message) VALUES
    ('user.signed_up', 'harry',  'seeded during database init'),
    ('game.started',   'ada',    'seeded during database init');
