# Kafka Connect sandbox

A standalone playground for learning Kafka Connect. It is **not wired into
anything else in this repo** — no shared config, no shared network, no shared
database. `./start.sh --clean` deletes every trace of it.

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

Everything runs in local containers on your machine. Nothing is deployed
anywhere: every port binds to localhost, and one flag removes the lot.

Requires Docker (with Compose v2) and roughly 4 GB of memory free.

```bash
cd kafka-connect
./start.sh
```

That single script does the whole thing: builds the Connect image, starts the
four containers, waits until Elasticsearch and Connect answer, registers both
connectors, inserts one event, and shows you the document that came out the far
end. The first run takes a few minutes because it downloads the connector
plugins; after that it is seconds.

```bash
./start.sh --no-demo   # up + register only, no sample event
./start.sh --fresh     # wipe the volumes first and start clean
./start.sh --stop      # stop the containers, keep the data
./start.sh --clean     # delete containers, network and volumes
```

Then push your own events:

```bash
./scripts/insert-event.sh game.finished harry "first hand-written event"
sleep 3
./scripts/show-events.sh
```

`insert-event.sh` is nothing clever — it is one `INSERT` over `psql`. You can do
the same thing by hand in `./scripts/psql.sh`, or from any Postgres client
pointed at `localhost:5433` (`demo`/`demo`).

There is a `Makefile` wrapping the same scripts if you prefer it: `make up`,
`make register`, `make insert`, `make events`, `make clean`, `make help`.

> **If the first run fails**, read the next section before debugging anything
> else — this stack has never been executed end to end, and the connector plugin
> versions are the part most likely to need a nudge.

## A known unverified bit — read this if the first run fails

**This stack has never been run end to end.** It was written in an environment
with no Docker daemon, so the Compose file, the connector JSON, the shell scripts
and the REST payloads in this README are all syntax-checked, but no container has
ever actually started. Treat your first `./start.sh` as the real test.

The specific risk is **connector plugin versions**, because the two plugins come
from different places and have to agree with the base image's Java version:

| Plugin | Version | Confidence |
| --- | --- | --- |
| Debezium Postgres | `2.7.4.Final`, pinned | Verified to exist on Maven Central. 2.7.x targets Kafka 3.x and Java 11, matching the CP 7.6 image. **Do not bump to 3.x** without also moving to a Java 17 base image. |
| Elasticsearch sink | `latest`, unpinned | **Not verified.** Confluent Hub was unreachable when this was written, so no specific version could be confirmed to exist. `latest` keeps the build working but means you get whatever is current. |

### Symptoms and fixes

**The image build fails at the `confluent-hub install` line.** Either the network
blocked Confluent Hub, or the version string is wrong. Retry; if it persists, pin
a known version (below).

**The build succeeds but the sink connector will not create**, with
`Failed to find any class that implements Connector and which name matches
io.confluent.connect.elasticsearch.ElasticsearchSinkConnector`. The plugin did
not land on the plugin path. Check what the worker actually loaded:

```bash
curl -s http://localhost:8083/connector-plugins
docker compose exec connect ls /usr/share/confluent-hub-components
```

**`UnsupportedClassVersionError` in `docker compose logs connect`.** A plugin was
compiled for a newer Java than the base image provides — this is what a too-new
Debezium or ES sink looks like. Pin both down, or move `CP_VERSION` up.

**The sink connects but every write fails against Elasticsearch.** Likely an ES
sink major version that does not speak to Elasticsearch 8. Either pin an ES sink
in the 14.x/15.x range, or drop `docker.elastic.co/elasticsearch/elasticsearch`
to `7.17.22` in `docker-compose.yml`.

### Pinning a version

All three versions are build args, settable in `.env` (copy `.env.example`):

```bash
echo 'ES_SINK_VERSION=14.1.0' >> .env
docker compose build --no-cache connect
./start.sh
```

Once you have a working build, find out what you actually got and pin that:

```bash
curl -s http://localhost:8083/connector-plugins \
  | tr ',' '\n' | grep -A1 elasticsearch
```

## Poke at each stage

| Command | What it shows |
| --- | --- |
| `./scripts/psql.sh` | psql shell on the source DB — `INSERT`/`UPDATE`/`DELETE` by hand |
| `./scripts/consume-topic.sh` | the raw Debezium change events on the Kafka topic |
| `./scripts/show-events.sh` | the resulting documents in Elasticsearch |
| `./scripts/status.sh` | connector + task state, with the top of the stack trace on failure |
| `docker compose logs -f connect` | the Connect worker log |

The interesting one is `consume-topic.sh`. Open it in a second terminal, then insert or
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
`UPDATE` in `psql.sh` and you will see `before` populated too — that is what
`REPLICA IDENTITY FULL` bought us in `postgres/init/01-events.sql`.

A `DELETE` produces a delete event **and** a tombstone (a record with a null
value). The sink is configured with `behavior.on.null.values: delete`, so the
document disappears from Elasticsearch. That round trip is worth doing once.

## The parts

```
start.sh                     one command: build, start, register, demo event
docker-compose.yml           postgres, kafka (KRaft), elasticsearch, connect
connect/Dockerfile           Connect worker + the two connector plugins
postgres/init/01-events.sql  the events table, applied on first start
connectors/*.json            the two connector configs, POSTed to the REST API
scripts/*.sh                 the individual steps start.sh strings together
Makefile                     thin wrapper over the same scripts
.env.example                 only needed if the default host ports clash
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

Every connector in this stack was created by POSTing JSON to that API — there is
no connector config file the worker reads at boot. See
[Posting to the Connect REST API](#posting-to-the-connect-rest-api) below for the
exact payloads.

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
`./scripts/register-connectors.sh`) and watch updates start piling up as separate documents. SMTs
are the cheapest way to learn what Connect is doing.

## Posting to the Connect REST API

The worker listens on `http://localhost:8083`. `./scripts/register-connectors.sh`
just POSTs the two files in `connectors/` to it — but doing it by hand is the
best way to understand what a connector actually is. Every example below is
copy-pasteable.

### Create the Postgres source connector

`POST /connectors` with a `name` and a `config` object:

```bash
curl -s -X POST http://localhost:8083/connectors \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "events-postgres-source",
    "config": {
      "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
      "tasks.max": "1",
      "database.hostname": "postgres",
      "database.port": "5432",
      "database.user": "demo",
      "database.password": "demo",
      "database.dbname": "demo",
      "topic.prefix": "demo",
      "table.include.list": "public.events",
      "plugin.name": "pgoutput",
      "slot.name": "events_slot",
      "publication.name": "events_pub",
      "publication.autocreate.mode": "filtered",
      "snapshot.mode": "initial",
      "time.precision.mode": "connect",
      "topic.creation.default.replication.factor": "1",
      "topic.creation.default.partitions": "1"
    }
  }'
```

Hostnames are container names (`postgres`, `kafka`, `elasticsearch`) because the
worker resolves them inside the compose network, not from your laptop.

### Create the Elasticsearch sink connector

```bash
curl -s -X POST http://localhost:8083/connectors \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "events-elasticsearch-sink",
    "config": {
      "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
      "tasks.max": "1",
      "topics": "demo.public.events",
      "connection.url": "http://elasticsearch:9200",
      "key.ignore": "false",
      "schema.ignore": "true",
      "behavior.on.null.values": "delete",
      "transforms": "unwrap,extractKey,route",
      "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
      "transforms.unwrap.delete.tombstone.handling.mode": "tombstone",
      "transforms.unwrap.add.fields": "op,source.ts_ms",
      "transforms.extractKey.type": "org.apache.kafka.connect.transforms.ExtractField$Key",
      "transforms.extractKey.field": "id",
      "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
      "transforms.route.regex": "demo\\.public\\.events",
      "transforms.route.replacement": "events"
    }
  }'
```

A `sink` connector needs `topics` (or `topics.regex`); a `source` connector
decides its own topics. That is the only structural difference between the two.

### Change a connector without recreating it

`PUT /connectors/<name>/config` takes **just the config object**, no `name` and
no `config` wrapper. It creates the connector if it does not exist, so it is the
idempotent way to apply a change:

```bash
curl -s -X PUT http://localhost:8083/connectors/events-elasticsearch-sink/config \
  -H 'Content-Type: application/json' \
  -d '{
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "tasks.max": "1",
    "topics": "demo.public.events",
    "connection.url": "http://elasticsearch:9200",
    "key.ignore": "true",
    "schema.ignore": "true"
  }'
```

That particular body is worth running: it drops the transforms and sets
`key.ignore: true`, so documents get generated ids instead of the row id. Insert
and then update the same row and you will get two documents rather than one.
`./scripts/register-connectors.sh` puts it back.

### Check a config before you commit to it

`PUT /connector-plugins/<class>/config/validate` runs the connector's own
validation and returns every field with its errors. Much faster than creating a
connector and reading a stack trace:

```bash
curl -s -X PUT \
  http://localhost:8083/connector-plugins/io.confluent.connect.elasticsearch.ElasticsearchSinkConnector/config/validate \
  -H 'Content-Type: application/json' \
  -d '{
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "name": "scratch",
    "topics": "demo.public.events",
    "connection.url": "not-a-url"
  }' | grep -o '"errors":\[[^]]*\]' | grep -v '\[\]'
```

### Everything else

```bash
# what exists, and what state is it in
curl -s http://localhost:8083/connectors
curl -s http://localhost:8083/connectors?expand=status
curl -s http://localhost:8083/connectors/events-postgres-source/status
curl -s http://localhost:8083/connectors/events-postgres-source/config
curl -s http://localhost:8083/connectors/events-postgres-source/tasks

# which plugins this worker has installed
curl -s http://localhost:8083/connector-plugins

# lifecycle
curl -s -X PUT    http://localhost:8083/connectors/events-elasticsearch-sink/pause
curl -s -X PUT    http://localhost:8083/connectors/events-elasticsearch-sink/resume
curl -s -X POST   http://localhost:8083/connectors/events-elasticsearch-sink/restart
curl -s -X POST   http://localhost:8083/connectors/events-elasticsearch-sink/tasks/0/restart
curl -s -X DELETE http://localhost:8083/connectors/events-elasticsearch-sink

# worker itself
curl -s http://localhost:8083/
```

Pipe any of these through `jq` if you have it — Connect returns dense one-line
JSON.

### Two experiments worth doing

**Kafka is a buffer.** Pause the sink, insert several rows, confirm nothing new
is in Elasticsearch, then resume and watch them all arrive at once:

```bash
curl -s -X PUT http://localhost:8083/connectors/events-elasticsearch-sink/pause
for i in 1 2 3; do ./scripts/insert-event.sh buffered.event harry "number $i"; done
./scripts/show-events.sh          # unchanged
curl -s -X PUT http://localhost:8083/connectors/events-elasticsearch-sink/resume
sleep 5 && ./scripts/show-events.sh
```

**Connectors are decoupled from the data.** Delete the sink entirely, insert
rows, then recreate it. It resumes from its stored consumer offset, so it picks
up the rows it missed — nothing was lost, because the events live in Kafka, not
in the connector.

## When it breaks

**A connector is FAILED.** `./scripts/status.sh` prints the head of the trace;
`docker compose logs connect` has the rest.

**`./scripts/show-events.sh` returns `index_not_found_exception`.** No document has reached
Elasticsearch yet. Check the sink is `RUNNING`, then check the topic has data
with `./scripts/consume-topic.sh`. If the topic is empty the problem is upstream, in the source.

**The topic is empty after an insert.** Confirm the source connector is
`RUNNING`, and confirm the row really landed: `./scripts/psql.sh`, then
`SELECT * FROM events;`.

**The build fails fetching a plugin.** `connect/Dockerfile` pulls Debezium from
Maven Central and the Elasticsearch sink from Confluent Hub; both need network at
build time. See [A known unverified bit](#a-known-unverified-bit--read-this-if-the-first-run-fails)
— plugin versions are the least-tested part of this stack.

**Nothing works and you want a clean slate.** `./start.sh --fresh` — wipes the volumes
(so the replication slot and the Elasticsearch index go too) and rebuilds.

## Things deliberately left out

Schema Registry and Avro (JSON with schemas keeps it readable with `curl`),
authentication anywhere, multiple brokers, dead-letter queues, and any Kubernetes
manifests — the "deployment" here is Compose on one machine. All of those are
reasonable next steps; none of them help while you are learning what a connector
actually does.

Credentials are `demo`/`demo` and everything binds to localhost. This stack is
not meant to be exposed.
