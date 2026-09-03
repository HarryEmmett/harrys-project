# Sourced by the other scripts. Not meant to be run directly.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="$(dirname "$HERE")"
cd "$STACK_DIR"

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "error: neither 'docker compose' nor 'docker-compose' is available" >&2
  exit 1
fi

CONNECT_URL="http://localhost:${CONNECT_HOST_PORT:-8083}"
ES_URL="http://localhost:${ES_HOST_PORT:-9200}"
PG_USER="${POSTGRES_USER:-demo}"
PG_DB="${POSTGRES_DB:-demo}"
CDC_TOPIC="demo.public.events"
ES_INDEX="events"
