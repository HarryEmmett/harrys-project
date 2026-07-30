// Package ws is the realtime half of the service: a room-per-conversation
// WebSocket hub.
//
// Rooms follow the pattern shared/friends-messages-service-plan.md describes
// for the Nest gateway — a client joins the room named after a conversation
// id, and a new message is emitted only to that room. The event names below
// are the `ws.messages` block from that plan; add them to
// shared/constants.ts so the frontend imports them rather than retyping the
// strings.
//
// Transport note: this is a plain WebSocket server with a JSON envelope, not
// socket.io. server/ speaks socket.io, so the UI needs a plain WebSocket
// client (or a small adapter) for this service. See the README.
package ws

import (
	"encoding/json"
	"log/slog"
	"sync"
)

// Event names, mirroring `ws.messages` in shared/constants.ts.
const (
	// MessageRoomEvent is sent by a client to join a conversation's room.
	MessageRoomEvent = "message-room"
	// MessageRoomLeaveEvent is its counterpart.
	MessageRoomLeaveEvent = "message-room_leave"
	// MessageAddedEvent is emitted to a room when a message is created.
	MessageAddedEvent = "message-added"
	// MessageUpdatedEvent and MessageDeletedEvent cover the edit/unsend routes.
	MessageUpdatedEvent = "message-updated"
	MessageDeletedEvent = "message-deleted"
	// ErrorEvent reports a malformed frame back to the sender.
	ErrorEvent = "error"
)

// Envelope is every frame in both directions: an event name plus an opaque
// payload. Keeping one shape means a client can dispatch on Event without
// sniffing the body.
type Envelope struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data,omitempty"`
}

// roomPayload is the body of a join/leave frame.
type roomPayload struct {
	ConversationID string `json:"conversationId"`
}

// Hub tracks which clients are in which rooms. It is safe for concurrent use;
// every method may be called from any goroutine.
type Hub struct {
	mu sync.RWMutex
	// rooms maps a conversation id to its members; membership maps a client to
	// the rooms it joined, so a disconnect can be cleaned up in one pass
	// instead of scanning every room.
	rooms      map[string]map[*Client]struct{}
	membership map[*Client]map[string]struct{}
}

// NewHub returns an empty hub.
func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]struct{}),
		membership: make(map[*Client]map[string]struct{}),
	}
}

func (h *Hub) register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.membership[c] = make(map[string]struct{})
}

// unregister removes a client from every room it joined. Called exactly once,
// when its read loop ends.
func (h *Hub) unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for room := range h.membership[c] {
		delete(h.rooms[room], c)
		if len(h.rooms[room]) == 0 {
			delete(h.rooms, room)
		}
	}
	delete(h.membership, c)
}

// Join adds a client to a room. Joining twice is a no-op.
func (h *Hub) Join(c *Client, room string) {
	if room == "" {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.membership[c]; !ok {
		return // already disconnected
	}
	if h.rooms[room] == nil {
		h.rooms[room] = make(map[*Client]struct{})
	}
	h.rooms[room][c] = struct{}{}
	h.membership[c][room] = struct{}{}
}

// Leave removes a client from a room. Leaving a room it is not in is a no-op.
func (h *Hub) Leave(c *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.rooms[room], c)
	if len(h.rooms[room]) == 0 {
		delete(h.rooms, room)
	}
	if rooms, ok := h.membership[c]; ok {
		delete(rooms, room)
	}
}

// Broadcast sends one event to every client in a room. It never blocks: a
// client whose buffer is full is dropped, on the reasoning that a consumer too
// slow to keep up is better disconnected (and reconnected, refetching history
// over REST) than allowed to stall every writer behind it.
//
// This is the only way messages reach clients. Handlers call it with the value
// the store returned, never with the raw request body — same layering rule as
// the Nest gateways in server/.
func (h *Hub) Broadcast(room, event string, data any) {
	frame, err := encode(event, data)
	if err != nil {
		slog.Error("encode broadcast", "event", event, "room", room, "error", err)
		return
	}

	h.mu.RLock()
	members := make([]*Client, 0, len(h.rooms[room]))
	for c := range h.rooms[room] {
		members = append(members, c)
	}
	h.mu.RUnlock()

	for _, c := range members {
		if !c.enqueue(frame) {
			slog.Warn("dropping slow websocket client", "clientId", c.id, "room", room)
			c.close()
		}
	}
}

// RoomSize reports how many clients are in a room. Exposed for tests and for
// a future presence/metrics hook.
func (h *Hub) RoomSize(room string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms[room])
}

// ClientCount reports how many clients are connected in total.
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.membership)
}

func encode(event string, data any) ([]byte, error) {
	payload, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	return json.Marshal(Envelope{Event: event, Data: payload})
}
