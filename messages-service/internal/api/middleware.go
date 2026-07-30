package api

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/harryemmett/harrys-project/messages-service/internal/config"
	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
)

type ctxKey int

const requestIDKey ctxKey = iota

// RequestIDFrom returns the id assigned to this request, or "" outside the
// middleware chain.
func RequestIDFrom(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey).(string)
	return id
}

type middleware func(http.Handler) http.Handler

// chain applies middlewares so the first listed is the outermost — i.e. they
// run in the order written.
func chain(h http.Handler, mws ...middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

// withRequestID tags each request so log lines from one request can be tied
// together, echoing the id back in X-Request-Id.
func withRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-Id")
		if id == "" {
			id = domain.NewID()
		}
		w.Header().Set("X-Request-Id", id)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey, id)))
	})
}

// statusRecorder captures the status code for the access log.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

// Unwrap lets http.ResponseController reach the underlying writer, which is
// what keeps the WebSocket hijack working through this middleware.
func (r *statusRecorder) Unwrap() http.ResponseWriter { return r.ResponseWriter }

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(rec, r)

		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"duration", time.Since(start),
			"requestId", RequestIDFrom(r.Context()),
		)
	})
}

// withRecovery turns a panic in a handler into a 500 instead of killing the
// whole process and dropping every other in-flight connection.
func withRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("panic in handler",
					"panic", rec,
					"path", r.URL.Path,
					"requestId", RequestIDFrom(r.Context()),
				)
				writeError(w, http.StatusInternalServerError, "Internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// withCORS answers preflights and adds the response headers browsers need.
// The WebSocket route does its own origin check against the same config (see
// ws.Handler) because the browser does not send a preflight for an upgrade.
func withCORS(cfg config.Config) middleware {
	allowedMethods := strings.Join([]string{
		http.MethodGet, http.MethodPost, http.MethodPatch,
		http.MethodDelete, http.MethodOptions,
	}, ", ")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && cfg.AllowsOrigin(origin) {
				if cfg.AllowsAllOrigins() {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				} else {
					// Echoing a specific origin makes the response vary by it,
					// so caches must not reuse one origin's response for another.
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Add("Vary", "Origin")
				}
				w.Header().Set("Access-Control-Allow-Methods", allowedMethods)
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Request-Id")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
