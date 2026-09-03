package ws

import (
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/harryemmett/harrys-project/messages-service/internal/config"
	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
)

// Handler upgrades GET /ws to a WebSocket and hands the connection to the hub.
func Handler(hub *Hub, cfg config.Config) http.HandlerFunc {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		// A browser sends no CORS preflight for an upgrade, so this is the
		// only thing standing between the service and cross-site WebSocket
		// hijacking. It reads the same config as the CORS middleware; a
		// missing Origin (non-browser client) is allowed through.
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true
			}
			return cfg.AllowsOrigin(origin)
		},
	}

	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			// Upgrade already wrote a response; just record why.
			slog.Warn("websocket upgrade failed", "error", err, "origin", r.Header.Get("Origin"))
			return
		}

		client := newClient(hub, conn, domain.NewID())
		client.start()
		slog.Info("websocket connected", "clientId", client.id, "clients", hub.ClientCount())
	}
}
