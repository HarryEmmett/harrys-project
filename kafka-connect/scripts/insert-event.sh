#!/usr/bin/env bash
# Push an event into Postgres by hand. This is the thing that starts the pipeline.
#   ./scripts/insert-event.sh <event_type> [user_id] [message]
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"

etype="${1:-demo.event}"
uid="${2:-harry}"
msg="${3:-hand-written at $(date -u +%H:%M:%SZ)}"

# :'var' makes psql quote the value safely, so spaces and apostrophes are fine.
$DC exec -T postgres psql -q -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" \
  -v etype="$etype" -v uid="$uid" -v msg="$msg" \
  -c "INSERT INTO public.events (event_type, user_id, message)
      VALUES (:'etype', :'uid', :'msg')
      RETURNING id, event_type, user_id, message;"
