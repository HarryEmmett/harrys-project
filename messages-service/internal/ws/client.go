package ws

import (
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// writeWait bounds a single write; pongWait bounds silence from the peer.
	writeWait = 10 * time.Second
	pongWait  = 60 * time.Second
	// pingPeriod must be shorter than pongWait or the server would time out a
	// healthy connection before its own ping could refresh the deadline.
	pingPeriod = (pongWait * 9) / 10
	// maxMessageSize caps an inbound frame. Clients only ever send small
	// join/leave envelopes — message bodies go over REST.
	maxMessageSize = 4 * 1024
	// sendBuffer is how far behind a client may fall before it is dropped.
	sendBuffer = 32
)

// Client is one WebSocket connection. Writes go through the send channel so
// that exactly one goroutine (writePump) touches the connection — gorilla
// allows only one concurrent writer.
type Client struct {
	id   string
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
	// done is closed exactly once to signal shutdown. Senders select on it
	// alongside send, so nothing ever blocks on — or panics writing to — a
	// connection that is going away. (Signalling via a separate channel rather
	// than closing send is what makes concurrent senders safe.)
	done      chan struct{}
	closeOnce sync.Once
}

// newClient wires a connection to the hub. Call start to begin pumping.
func newClient(hub *Hub, conn *websocket.Conn, id string) *Client {
	return &Client{
		id:   id,
		hub:  hub,
		conn: conn,
		send: make(chan []byte, sendBuffer),
		done: make(chan struct{}),
	}
}

// close is idempotent and safe from any goroutine.
func (c *Client) close() {
	c.closeOnce.Do(func() { close(c.done) })
}

// start runs both pumps. readPump owns the client's lifetime: when it returns,
// the client is unregistered and the writer is told to stop.
func (c *Client) start() {
	c.hub.register(c)
	go c.writePump()
	go c.readPump()
}

// readPump handles inbound frames — only room join/leave — until the peer goes
// away or misbehaves.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister(c)
		c.close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				slog.Warn("websocket closed unexpectedly", "clientId", c.id, "error", err)
			}
			return
		}
		c.handleFrame(raw)
	}
}

func (c *Client) handleFrame(raw []byte) {
	var env Envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		c.sendError(`malformed frame: expected {"event":...,"data":...}`)
		return
	}

	switch env.Event {
	case MessageRoomEvent, MessageRoomLeaveEvent:
		var payload roomPayload
		if err := json.Unmarshal(env.Data, &payload); err != nil || payload.ConversationID == "" {
			c.sendError(env.Event + " requires a non-empty conversationId")
			return
		}
		if env.Event == MessageRoomEvent {
			c.hub.Join(c, payload.ConversationID)
		} else {
			c.hub.Leave(c, payload.ConversationID)
		}
		// Echo the join/leave back so the client knows the room is live and
		// can stop buffering optimistic sends.
		c.sendEvent(env.Event, payload)
	default:
		c.sendError("unknown event: " + env.Event)
	}
}

// writePump owns the connection's write side: queued frames plus the periodic
// ping that keeps idle connections (and any proxy in between) alive.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case frame := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.TextMessage, frame); err != nil {
				return
			}
		case <-c.done:
			// Say goodbye politely, ignoring errors — this connection is going
			// away either way.
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			_ = c.conn.WriteMessage(websocket.CloseMessage,
				websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			return
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// enqueue queues one frame. It reports false if the client is closed or too
// far behind to accept it, and never blocks.
func (c *Client) enqueue(frame []byte) bool {
	select {
	case c.send <- frame:
		return true
	case <-c.done:
		return false
	default:
		return false
	}
}

// sendEvent queues one frame, dropping it if the client is backed up or gone.
func (c *Client) sendEvent(event string, data any) {
	frame, err := encode(event, data)
	if err != nil {
		slog.Error("encode frame", "event", event, "clientId", c.id, "error", err)
		return
	}
	c.enqueue(frame)
}

func (c *Client) sendError(message string) {
	c.sendEvent(ErrorEvent, map[string]string{"message": message})
}
