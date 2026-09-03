# Kafka Connect sandbox

A standalone playground for learning Kafka Connect. It is **not wired into
anything else in this repo** — no shared config, no shared network, no shared
database. `make clean` deletes every trace of it.

```
  you                Debezium               Kafka                 ES sink
  │                  (source connector)     (broker)              (sink connector)
  ▼                          │                 │                        │
┌──────────┐   WAL   ┌───────┴────────┐  ┌─────┴──────────────┐  ┌──────┴────────┐
│ Postgres │────────▶│  Kafka Connect ─┼─▶│ demo.public.events │─▶│ Elasticsearch │
│  events  │         │     worker      │  │      (topic)       │  │ events index  │
└──────────┘         └────────────────┘  └────────────────────┘  └───────────────┘
     ▲                                                                   │
   INSERT                                                          curl :9200
```

You hand-write a row into Postgres. Debezium notices it in the write-ahead log,
publishes a change event to Kafka, and the Elasticsearch sink turns that event
into a document. Four containers, no application code.

## Run it

Requires Docker (with Compose v2) and roughly 4 GB of memory free.

```bash
cd kafka-connect
make up          # build + start + wait until healthy   (first build: ~3-5 min)
make register    # create the source and sink connectors
```

`make register` prints the connector states. You want `RUNNING` for both the
connector and its task.

Then push an event and watch it come out the far end:

```bash
make insert TYPE=game.finished WHO=harry MSG="first hand-written event"
sleep 3
make events
```

`make events` hits Elasticsearch directly and should show your row as a document.

Everything in one go: `make demo`. Full teardown: `make clean`.

## Poke at each stage

| Command | What it shows |
| --- | --- |
| `make psql` | psql shell on the source DB — `INSERT`/`UPDATE`/`DELETE` by hand |
| `make topic` | the raw Debezium change events on the Kafka topic |
| `make events` | the resulting documents in Elasticsearch |
| `make status` | connector + task state, with the top of the stack trace on failure |
| `make logs` | the Connect worker log |

The interesting one is `make topic`. Open it in a second terminal, then insert or
update a row in a third, and watch the envelope arrive:

```json
{
  "before": null,
  "after":  { "id": 3, "event_type": "game.finished", "user_id": "harry", ... },
  "source": { "db": "demo", "table": "events", "lsn": 27723048, ... },
  "op": "c",
  "ts_ms": 1756915200000
}
```

`op` is `c` create, `u` update, `d` delete, `r` read-during-snapshot. Try an
`UPDATE` in `make psql` and you will see `before` populated too — that is what
`REPLICA IDENTITY FULL` bought us in `postgres/init/01-events.sql`.

A `DELETE` produces a delete event **and** a tombstone (a record with a null
value). The sink is configured with `behavior.on.null.values: delete`, so the
document disappears from Elasticsearch. That round trip is worth doing once.

## The parts

```
docker-compose.yml           postgres, kafka (KRaft), elasticsearch, connect
connect/Dockerfile           Connect worker + the two connector plugins
postgres/init/01-events.sql  the events table, applied on first start
connectors/*.json            the two connector configs, POSTed to the REST API
scripts/*.sh                 what the Makefile targets actually run
```

### Postgres

Started with `wal_level=logical`. Without that, the write-ahead log only carries
enough to recover from a crash, not enough to reconstruct row changes — CDC is
impossible. Debezium then creates a *replication slot* (`events_slot`) and a
*publication* (`events_pub`) and streams from there.

The replication slot is the thing to remember: Postgres will not discard WAL that
a slot has not consumed yet. A stopped connector with a live slot is how you fill
a disk in production.

### Kafka

One container in KRaft mode, so it is both broker and controller and there is no
ZooKeeper. Two listeners: `kafka:9092` for the other containers,
`localhost:29092` if you want to point a client on your laptop at it.

### Kafka Connect

Runs in **distributed mode** even though there is one worker, because that is the
mode with a REST API. Connector configs, offsets and status live in Kafka topics
(`_kcd-connect-*`), which is why a connector survives
`docker compose restart connect`.

The API is worth exploring by hand:

```bash
curl -s localhost:8083/connectors
curl -s localhost:8083/connectors/events-postgres-source/status
curl -s localhost:8083/connector-plugins
curl -s -X PUT  localhost:8083/connectors/events-elasticsearch-sink/pause
curl -s -X PUT  localhost:8083/connectors/events-elasticsearch-sink/resume
curl -s -X POST localhost:8083/connectors/events-elasticsearch-sink/restart
```

Pausing the sink, inserting a few rows, then resuming is a good way to see that
Kafka is a buffer and the connectors are decoupled.

### The sink and its transforms

`connectors/elasticsearch-sink.json` is where most of the learning is. The source
writes the full Debezium envelope to the topic; the sink reshapes it with three
single-message transforms, applied in order:

1. **`unwrap`** (`ExtractNewRecordState`) — replaces the envelope with just the
   `after` row, and appends `__op` and `__source_ts_ms` so you can still see what
   kind of change it was. Deletes become tombstones.
2. **`extractKey`** (`ExtractField$Key`) — the Debezium key is a struct
   `{"id": 3}`; this pulls out the bare `3` so it becomes the Elasticsearch
   document `_id`. That is what makes updates overwrite instead of duplicate.
3. **`route`** (`RegexRouter`) — renames the topic `demo.public.events` to
   `events`, so the index is called `events` rather than `demo.public.events`.

Try commenting out `extractKey` (delete it from `transforms` and re-run
`make register`) and watch updates start piling up as separate documents. SMTs
are the cheapest way to learn what Connect is doing.

## When it breaks

**A connector is FAILED.** `make status` prints the head of the trace;
`make logs` has the rest.

**`make events` returns `index_not_found_exception`.** No document has reached
Elasticsearch yet. Check the sink is `RUNNING`, then check the topic has data
with `make topic`. If the topic is empty the problem is upstream, in the source.

**The topic is empty after an insert.** Confirm the source connector is
`RUNNING`, and confirm the row really landed: `make psql`, then
`SELECT * FROM events;`.

**The build fails fetching a plugin.** `connect/Dockerfile` pulls Debezium from
Maven Central and the Elasticsearch sink from Confluent Hub; both need network at
build time.

**Nothing works and you want a clean slate.** `make reset` — wipes the volumes
(so the replication slot and the Elasticsearch index go too) and rebuilds.

## Things deliberately left out

Schema Registry and Avro (JSON with schemas keeps it readable with `curl`),
authentication anywhere, multiple brokers, dead-letter queues, and any Kubernetes
manifests — the "deployment" here is Compose on one machine. All of those are
reasonable next steps; none of them help while you are learning what a connector
actually does.

Credentials are `demo`/`demo` and everything binds to localhost. This stack is
not meant to be exposed.
