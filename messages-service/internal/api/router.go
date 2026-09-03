// Package api is the HTTP surface: routing, middleware and request handling.
package api

import (
	"net/http"

	"github.com/harryemmett/harrys-project/messages-service/internal/config"
	"github.com/harryemmett/harrys-project/messages-service/internal/store"
	"github.com/harryemmett/harrys-project/messages-service/internal/ws"
)

// NewRouter wires every route the service exposes.
//
//	GET    /healthz                        liveness/readiness
//	GET    /ws                             WebSocket upgrade
//	GET    /messages/{conversationId}      conversation history (newest first)
//	POST   /messages/{conversationId}      send a message
//	PATCH  /messages/{id}                  edit a message
//	DELETE /messages/{id}                  unsend a message
//
// Routes come from the plan in shared/friends-messages-service-plan.md. The
// Friends half of that plan is not implemented here — see the README for where
// it would slot in.
func NewRouter(cfg config.Config, st store.MessageStore, hub *ws.Hub) http.Handler {
	messages := &messagesHandler{store: st, hub: hub}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"status":  "ok",
			"clients": hub.ClientCount(),
		})
	})

	mux.Handle("GET /ws", ws.Handler(hub, cfg))

	// Go 1.22+ pattern matching: the method and the {placeholder} are part of
	// the pattern, so handlers read path values with r.PathValue and no
	// third-party router is needed.
	mux.HandleFunc("GET /messages/{conversationId}", messages.list)
	mux.HandleFunc("POST /messages/{conversationId}", messages.create)
	mux.HandleFunc("PATCH /messages/{id}", messages.update)
	mux.HandleFunc("DELETE /messages/{id}", messages.remove)

	// Outermost first: a request id exists before anything logs, and recovery
	// wraps the handlers so a panic still gets logged with that id.
	return chain(mux,
		withRequestID,
		withLogging,
		withCORS(cfg),
		withRecovery,
	)
}
