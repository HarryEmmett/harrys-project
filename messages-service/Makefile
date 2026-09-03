.PHONY: run test test-postgres check fmt build tidy

# Run with the in-memory store on :4000.
run:
	go run ./cmd/server

# Everything except the Postgres store, which skips without TEST_DATABASE_URL.
# -race because the store and hub are shared across request goroutines.
test:
	go test -race ./...

# Integration tests against a real database:
#   make test-postgres TEST_DATABASE_URL=postgres://user@localhost:5432/messages_test?sslmode=disable
test-postgres:
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) go test -race ./internal/store/postgres/

check: fmt
	go vet ./...
	go test -race ./...

fmt:
	gofmt -l -w .

build:
	go build -o bin/messages-service ./cmd/server

tidy:
	go mod tidy
