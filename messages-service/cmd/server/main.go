// Command server runs the messages-service: a REST API for conversation
// history plus a WebSocket hub that pushes new messages live.
//
// See the README for configuration and the wire protocol.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/harryemmett/harrys-project/messages-service/internal/api"
	"github.com/harryemmett/harrys-project/messages-service/internal/config"
	"github.com/harryemmett/harrys-project/messages-service/internal/store"
	"github.com/harryemmett/harrys-project/messages-service/internal/store/memory"
	"github.com/harryemmett/harrys-project/messages-service/internal/store/postgres"
	"github.com/harryemmett/harrys-project/messages-service/internal/ws"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	if err := run(); err != nil {
		slog.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	// Cancelled on SIGINT/SIGTERM; this is the signal to start draining.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	st, err := newStore(ctx, cfg)
	if err != nil {
		return err
	}
	defer st.Close()

	srv := &http.Server{
		Addr:    cfg.Addr,
		Handler: api.NewRouter(cfg, st, ws.NewHub()),
		// No WriteTimeout: it would cut off long-lived WebSocket connections
		// mid-stream. The ws package enforces its own per-write deadlines
		// instead, and ReadHeaderTimeout still covers slow-header attacks.
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	errs := make(chan error, 1)
	go func() {
		slog.Info("messages-service listening", "addr", cfg.Addr, "store", cfg.Store)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errs <- err
			return
		}
		errs <- nil
	}()

	select {
	case err := <-errs:
		return err
	case <-ctx.Done():
		slog.Info("shutting down", "timeout", cfg.ShutdownTimeout)
	}

	// Give in-flight requests a bounded window to finish. Shutdown does not
	// wait for hijacked (WebSocket) connections, which is why the timeout is
	// short — those clients reconnect.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	return <-errs
}

func newStore(ctx context.Context, cfg config.Config) (store.MessageStore, error) {
	if cfg.Store == config.BackendPostgres {
		// Bound the connect attempt so a wrong DB_HOST fails fast at boot
		// rather than hanging the process.
		connectCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		return postgres.New(connectCtx, cfg.DatabaseURL)
	}
	slog.Warn("using the in-memory store — messages are lost on restart",
		"hint", "set MESSAGES_STORE=postgres to persist")
	return memory.New(), nil
}
