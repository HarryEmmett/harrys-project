# Kafka Connect learning sandbox — see README.md
.DEFAULT_GOAL := help

.PHONY: help start up build register demo insert events topic status psql logs ps down clean reset

help: ## Show this help
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

start: ## Everything in one command (same as ./start.sh)
	./start.sh

up: ## Build images, start everything, wait until healthy
	docker compose up -d --build
	./scripts/wait-for-stack.sh

build: ## Rebuild the Kafka Connect image only
	docker compose build connect

register: ## (Re-)create the source and sink connectors
	./scripts/register-connectors.sh

demo: up register events ## up + register + show what landed in Elasticsearch

insert: ## Insert one event. Override: make insert TYPE=x WHO=y MSG="z"
	./scripts/insert-event.sh "$(or $(TYPE),demo.event)" "$(or $(WHO),harry)" "$(or $(MSG),hello from make)"

events: ## Show the documents currently in the Elasticsearch index
	./scripts/show-events.sh

topic: ## Tail the raw Debezium change events on the Kafka topic (Ctrl-C to stop)
	./scripts/consume-topic.sh

status: ## Connector and task states
	./scripts/status.sh

psql: ## Open a psql shell on the source database
	./scripts/psql.sh

logs: ## Follow the Kafka Connect worker log
	docker compose logs -f connect

ps: ## Container status
	docker compose ps

down: ## Stop the stack, keep the data volumes
	docker compose down

clean: ## Stop and delete everything, volumes included
	docker compose down -v --remove-orphans

reset: clean up register ## Full wipe and rebuild from scratch
