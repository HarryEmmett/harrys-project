// Package config loads runtime settings from the environment.
package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// Backend selects which store implementation main wires up.
type Backend string

const (
	// BackendMemory keeps everything in process. Zero setup — the default so
	// `go run ./cmd/server` works on a clean checkout.
	BackendMemory Backend = "memory"
	// BackendPostgres persists to the DB_* database. This service owns its own
	// tables (see internal/store/postgres/schema.sql); it does not share the
	// games-service's.
	BackendPostgres Backend = "postgres"
)

// Config is the fully resolved configuration for one process.
type Config struct {
	Addr            string
	Store           Backend
	DatabaseURL     string
	AllowedOrigins  []string
	ShutdownTimeout time.Duration
}

// Load reads configuration from the environment, applying defaults. It returns
// an error rather than exiting so main owns the process lifecycle.
//
// Postgres settings reuse the same DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/
// DB_NAME names as the repo-root .env that shared/scripts/seedDb.ts reads, so
// one env file covers both services. DB_NAME should point at this service's
// own database.
func Load() (Config, error) {
	cfg := Config{
		Addr:            ":" + env("PORT", "4000"),
		Store:           Backend(env("MESSAGES_STORE", string(BackendMemory))),
		AllowedOrigins:  splitAndTrim(env("ALLOWED_ORIGINS", "*")),
		ShutdownTimeout: 10 * time.Second,
	}

	switch cfg.Store {
	case BackendMemory:
	case BackendPostgres:
		dsn, err := databaseURL()
		if err != nil {
			return Config{}, err
		}
		cfg.DatabaseURL = dsn
	default:
		return Config{}, fmt.Errorf("config: unknown MESSAGES_STORE %q (want %q or %q)",
			cfg.Store, BackendMemory, BackendPostgres)
	}

	if len(cfg.AllowedOrigins) == 0 {
		return Config{}, fmt.Errorf("config: ALLOWED_ORIGINS must not be empty")
	}
	return cfg, nil
}

// AllowsAllOrigins reports whether the config permits any browser origin. Used
// by both the CORS middleware and the WebSocket upgrader so the two can never
// drift apart on what is allowed.
func (c Config) AllowsAllOrigins() bool {
	for _, o := range c.AllowedOrigins {
		if o == "*" {
			return true
		}
	}
	return false
}

// AllowsOrigin reports whether the given Origin header value is permitted.
func (c Config) AllowsOrigin(origin string) bool {
	if c.AllowsAllOrigins() {
		return true
	}
	for _, o := range c.AllowedOrigins {
		if strings.EqualFold(o, origin) {
			return true
		}
	}
	return false
}

// DATABASE_URL wins if set; otherwise the DB_* parts are assembled into one.
func databaseURL() (string, error) {
	if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
		return dsn, nil
	}

	user := os.Getenv("DB_USERNAME")
	name := os.Getenv("DB_NAME")
	if user == "" || name == "" {
		return "", fmt.Errorf("config: MESSAGES_STORE=postgres needs DATABASE_URL, or DB_USERNAME and DB_NAME")
	}

	port := env("DB_PORT", "5432")
	if _, err := strconv.Atoi(port); err != nil {
		return "", fmt.Errorf("config: DB_PORT %q is not a number", port)
	}

	dsn := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, os.Getenv("DB_PASSWORD")),
		Host:   env("DB_HOST", "localhost") + ":" + port,
		Path:   "/" + name,
	}
	q := dsn.Query()
	q.Set("sslmode", env("DB_SSLMODE", "disable"))
	dsn.RawQuery = q.Encode()

	return dsn.String(), nil
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func splitAndTrim(csv string) []string {
	parts := strings.Split(csv, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
