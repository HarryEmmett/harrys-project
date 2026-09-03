#!/usr/bin/env bash
# (Re-)creates both connectors from the JSON files in ../connectors.
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"

register() {
  local file="$1"
  local name
  name="$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$file" | head -1)"

  echo "--> $name"
  # Delete first so the script is idempotent; a 404 here is expected and fine.
  curl -s -o /dev/null -X DELETE "$CONNECT_URL/connectors/$name" || true
  sleep 1

  if ! curl -sS -f -X POST \
        -H 'Content-Type: application/json' \
        --data @"$file" \
        "$CONNECT_URL/connectors" >/dev/null; then
    echo "    failed to create $name" >&2
    return 1
  fi
  echo "    created"
}

register connectors/postgres-source.json
register connectors/elasticsearch-sink.json

echo
echo "giving the tasks a moment to start..."
sleep 8
exec "$HERE/status.sh"
