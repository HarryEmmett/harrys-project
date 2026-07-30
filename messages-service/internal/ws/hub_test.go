package ws_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/harryemmett/harrys-project/messages-service/internal/config"
	"github.com/harryemmett/harrys-project/messages-service/internal/ws"
)

// dial spins up the real upgrade handler and connects a real client to it, so
// these tests cover the handshake, the frame protocol and the hub together.
func dial(t *testing.T, hub *ws.Hub, origin string) *websocket.Conn {
	t.Helper()

	cfg := config.Config{AllowedOrigins: []string{"http://localhost:5173"}}
	srv := httptest.NewServer(ws.Handler(hub, cfg))
	t.Cleanup(srv.Close)

	header := http.Header{}
	if origin != "" {
		header.Set("Origin", origin)
	}

	conn, res, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(srv.URL, "http")+"/ws", header)
	if err != nil {
		if res != nil {
			t.Fatalf("dial: %v (status %d)", err, res.StatusCode)
		}
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { conn.Close() })
	return conn
}

func send(t *testing.T, conn *websocket.Conn, event string, data any) {
	t.Helper()

	payload, err := json.Marshal(data)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}
	if err := conn.WriteJSON(ws.Envelope{Event: event, Data: payload}); err != nil {
		t.Fatalf("write %s: %v", event, err)
	}
}

func read(t *testing.T, conn *websocket.Conn) ws.Envelope {
	t.Helper()

	if err := conn.SetReadDeadline(time.Now().Add(2 * time.Second)); err != nil {
		t.Fatalf("set deadline: %v", err)
	}
	var env ws.Envelope
	if err := conn.ReadJSON(&env); err != nil {
		t.Fatalf("read frame: %v", err)
	}
	return env
}

// waitForRoom polls until the hub has registered the join, which happens on the
// server's goroutine after the client's write returns.
func waitForRoom(t *testing.T, hub *ws.Hub, room string, want int) {
	t.Helper()

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if hub.RoomSize(room) == want {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatalf("room %q has %d clients, want %d", room, hub.RoomSize(room), want)
}

func TestBroadcastReachesOnlyTheRoom(t *testing.T) {
	hub := ws.NewHub()

	inRoom := dial(t, hub, "http://localhost:5173")
	send(t, inRoom, ws.MessageRoomEvent, map[string]string{"conversationId": "conv-1"})
	if env := read(t, inRoom); env.Event != ws.MessageRoomEvent {
		t.Fatalf("join echo = %q, want %q", env.Event, ws.MessageRoomEvent)
	}
	waitForRoom(t, hub, "conv-1", 1)

	hub.Broadcast("conv-1", ws.MessageAddedEvent, map[string]string{"content": "hello"})

	env := read(t, inRoom)
	if env.Event != ws.MessageAddedEvent {
		t.Errorf("event = %q, want %q", env.Event, ws.MessageAddedEvent)
	}
	var got map[string]string
	if err := json.Unmarshal(env.Data, &got); err != nil {
		t.Fatalf("unmarshal data: %v", err)
	}
	if got["content"] != "hello" {
		t.Errorf("data = %v, want content hello", got)
	}

	// A broadcast to a different conversation must not arrive here.
	hub.Broadcast("conv-2", ws.MessageAddedEvent, map[string]string{"content": "not for you"})
	if err := inRoom.SetReadDeadline(time.Now().Add(150 * time.Millisecond)); err != nil {
		t.Fatalf("set deadline: %v", err)
	}
	if _, _, err := inRoom.ReadMessage(); err == nil {
		t.Error("received a broadcast for a room this client never joined")
	}
}

func TestLeaveStopsDelivery(t *testing.T) {
	hub := ws.NewHub()

	conn := dial(t, hub, "http://localhost:5173")
	send(t, conn, ws.MessageRoomEvent, map[string]string{"conversationId": "conv-1"})
	read(t, conn)
	waitForRoom(t, hub, "conv-1", 1)

	send(t, conn, ws.MessageRoomLeaveEvent, map[string]string{"conversationId": "conv-1"})
	read(t, conn)
	waitForRoom(t, hub, "conv-1", 0)

	hub.Broadcast("conv-1", ws.MessageAddedEvent, map[string]string{"content": "after leaving"})
	if err := conn.SetReadDeadline(time.Now().Add(150 * time.Millisecond)); err != nil {
		t.Fatalf("set deadline: %v", err)
	}
	if _, _, err := conn.ReadMessage(); err == nil {
		t.Error("received a broadcast after leaving the room")
	}
}

func TestDisconnectClearsMembership(t *testing.T) {
	hub := ws.NewHub()

	conn := dial(t, hub, "http://localhost:5173")
	send(t, conn, ws.MessageRoomEvent, map[string]string{"conversationId": "conv-1"})
	read(t, conn)
	waitForRoom(t, hub, "conv-1", 1)

	conn.Close()

	waitForRoom(t, hub, "conv-1", 0)
	deadline := time.Now().Add(2 * time.Second)
	for hub.ClientCount() != 0 && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if hub.ClientCount() != 0 {
		t.Errorf("hub still tracks %d clients after disconnect", hub.ClientCount())
	}
}

func TestMalformedFramesGetAnError(t *testing.T) {
	hub := ws.NewHub()
	conn := dial(t, hub, "http://localhost:5173")

	tests := []struct {
		name  string
		write func()
	}{
		{"not json", func() {
			if err := conn.WriteMessage(websocket.TextMessage, []byte("{nope")); err != nil {
				t.Fatalf("write: %v", err)
			}
		}},
		{"unknown event", func() {
			send(t, conn, "not-an-event", map[string]string{})
		}},
		{"join without conversationId", func() {
			send(t, conn, ws.MessageRoomEvent, map[string]string{})
		}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			tc.write()
			if env := read(t, conn); env.Event != ws.ErrorEvent {
				t.Errorf("event = %q, want %q", env.Event, ws.ErrorEvent)
			}
		})
	}
}

func TestUpgradeRejectsDisallowedOrigin(t *testing.T) {
	cfg := config.Config{AllowedOrigins: []string{"http://localhost:5173"}}
	srv := httptest.NewServer(ws.Handler(ws.NewHub(), cfg))
	defer srv.Close()

	header := http.Header{"Origin": []string{"http://evil.example"}}
	conn, res, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(srv.URL, "http")+"/ws", header)
	if err == nil {
		conn.Close()
		t.Fatal("upgrade succeeded from a disallowed origin")
	}
	if res == nil || res.StatusCode != http.StatusForbidden {
		t.Errorf("status = %v, want 403", res)
	}
}
