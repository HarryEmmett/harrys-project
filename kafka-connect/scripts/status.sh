#!/usr/bin/env bash
# Shows every connector and every task, plus the first line of any failure trace.
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"

names="$(curl -s "$CONNECT_URL/connectors" | tr -d '[]"' | tr ',' '\n' | sed '/^$/d')"

if [ -z "$names" ]; then
  echo "no connectors registered (run: make register)"
  exit 0
fi

for n in $names; do
  body="$(curl -s "$CONNECT_URL/connectors/$n/status")"
  echo "$n"
  echo "$body" \
    | tr '{' '\n' \
    | grep -o '"state":"[A-Z]*"' \
    | cut -d'"' -f4 \
    | awk 'NR==1 {print "  connector: " $0; next} {print "  task:      " $0}'
  # Surface the top of the stack trace when something is FAILED.
  echo "$body" | grep -q '"state":"FAILED"' && {
    echo "$body" | tr ',' '\n' | grep -m1 'trace' | cut -c1-400 | sed 's/^/  /'
  }
  echo
done
