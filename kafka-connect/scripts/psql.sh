#!/usr/bin/env bash
# Interactive psql against the source database.
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"
exec $DC exec postgres psql -U "$PG_USER" -d "$PG_DB"
