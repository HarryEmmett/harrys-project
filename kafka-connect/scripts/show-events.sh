#!/usr/bin/env bash
# What actually landed in Elasticsearch.
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"

echo "index '$ES_INDEX':"
curl -s "$ES_URL/_cat/indices/$ES_INDEX?v" || true
echo
echo "documents (newest first):"
curl -s -H 'Content-Type: application/json' \
  "$ES_URL/$ES_INDEX/_search?pretty" \
  -d '{"size":20,"sort":[{"id":"desc"}]}'
