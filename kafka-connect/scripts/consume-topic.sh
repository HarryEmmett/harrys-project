#!/usr/bin/env bash
# Read the raw Debezium change events off the Kafka topic. Ctrl-C to stop.
# This is the middle of the pipeline: what the source wrote, before the sink
# transforms it.
source "$(cd "$(dirname "$0")" && pwd)/_common.sh"

$DC exec -T kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic "$CDC_TOPIC" \
  --from-beginning \
  --property print.key=true \
  --property key.separator=' | '
