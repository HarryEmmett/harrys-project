#!/usr/bin/env bash
# Blocks until Elasticsearch and the Kafka Connect REST API are both answering.
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"

wait_for() {
  local name="$1" url="$2" tries="${3:-60}" i=1
  printf 'waiting for %s ' "$name"
  while [ "$i" -le "$tries" ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      printf ' ready\n'
      return 0
    fi
    printf '.'
    sleep 3
    i=$((i + 1))
  done
  printf ' TIMED OUT\n'
  echo "  $name never became ready at $url" >&2
  echo "  try: $DC logs --tail=50" >&2
  return 1
}

wait_for "elasticsearch" "$ES_URL/_cluster/health"
wait_for "kafka connect" "$CONNECT_URL/connectors"

echo
echo "installed connector plugins:"
curl -s "$CONNECT_URL/connector-plugins" \
  | tr ',' '\n' | grep -o '"class":"[^"]*"' | cut -d'"' -f4 | sed 's/^/  /'
