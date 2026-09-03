#!/usr/bin/env bash
#
# One command to bring the whole sandbox up on this machine, in containers.
# Nothing is deployed anywhere: every port binds to localhost and `./start.sh
# --stop` (or --clean) puts it all back.
#
#   ./start.sh              build, start, register connectors, run a demo event
#   ./start.sh --fresh      wipe volumes first, then do all of the above
#   ./start.sh --no-demo    up + register only, insert your own events
#   ./start.sh --stop       stop the containers, keep the data
#   ./start.sh --clean      stop and delete everything, volumes included
#
set -euo pipefail
cd "$(cd "$(dirname "$0")" && pwd)"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

RUN_DEMO=1
FRESH=0
MODE=up

for arg in "$@"; do
  case "$arg" in
    --fresh)   FRESH=1 ;;
    --no-demo) RUN_DEMO=0 ;;
    --stop)    MODE=stop ;;
    --clean)   MODE=clean ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         die "unknown option: $arg (try --help)" ;;
  esac
done

# ---------------------------------------------------------------- preflight
command -v docker >/dev/null 2>&1 || die "docker is not installed"

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  die "docker compose (v2) or docker-compose is required"
fi

docker info >/dev/null 2>&1 || die "the docker daemon is not running — start Docker Desktop first"

case "$MODE" in
  stop)
    step "stopping (data volumes kept)"
    $DC down
    echo "start again with: ./start.sh"
    exit 0
    ;;
  clean)
    step "removing containers, network and volumes"
    $DC down -v --remove-orphans
    echo "gone. nothing left on this machine except the built image."
    exit 0
    ;;
esac

# ------------------------------------------------------------------- ports
for p in "${POSTGRES_HOST_PORT:-5433}" "${KAFKA_HOST_PORT:-29092}" \
         "${CONNECT_HOST_PORT:-8083}" "${ES_HOST_PORT:-9200}"; do
  if (command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1); then
    echo "warning: something is already listening on localhost:$p" >&2
    echo "         override it in .env (see .env.example) if the stack fails to start" >&2
  fi
done

# --------------------------------------------------------------------- run
if [ "$FRESH" = 1 ]; then
  step "wiping previous state"
  $DC down -v --remove-orphans
fi

step "building and starting containers"
echo "(the first build pulls the connector plugins and takes a few minutes)"
$DC up -d --build

step "waiting for elasticsearch and kafka connect"
./scripts/wait-for-stack.sh

step "registering connectors"
./scripts/register-connectors.sh

if [ "$RUN_DEMO" = 1 ]; then
  step "inserting a demo event into postgres"
  ./scripts/insert-event.sh "sandbox.started" "harry" "written by start.sh at $(date -u +%H:%M:%SZ)"

  step "waiting for it to travel postgres -> kafka -> elasticsearch"
  sleep 6

  step "what landed in elasticsearch"
  ./scripts/show-events.sh
fi

cat <<EOF

$(bold "the sandbox is up.")

  push an event      ./scripts/insert-event.sh order.placed harry "hello"
  see the documents  ./scripts/show-events.sh
  watch the topic    ./scripts/consume-topic.sh      (raw Debezium events)
  sql shell          ./scripts/psql.sh
  connector state    ./scripts/status.sh
  worker logs        $DC logs -f connect

  connect rest api   http://localhost:${CONNECT_HOST_PORT:-8083}
  elasticsearch      http://localhost:${ES_HOST_PORT:-9200}

  stop               ./start.sh --stop
  delete everything  ./start.sh --clean

README.md has copy-pasteable payloads for the Connect REST API.
EOF
