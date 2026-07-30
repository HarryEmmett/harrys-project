// Package domain holds the service's core types and their validation rules.
// It deliberately imports nothing from the transport (HTTP/WebSocket) or
// storage layers so both can depend on it without a cycle.
package domain

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

// MaxContentLength caps a single message body. Kept here rather than in the
// HTTP layer so every entry point (REST, future gRPC, seed scripts) enforces
// the same limit.
const MaxContentLength = 4000

// Message is the wire shape the frontend and this service agree on, matching
// the model in shared/friends-messages-service-plan.md:
//
//	Message: { id, conversationId, senderId, content, sentAt }
//
// SenderID is a client-generated persistent id today; it becomes the JWT
// subject once the auth-service exists. There is deliberately no
// 'me' | 'them' author field — that only made sense for a single hardcoded
// viewer. Clients derive "is this mine?" by comparing SenderID to their own.
type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	SenderID       string    `json:"senderId"`
	Content        string    `json:"content"`
	SentAt         time.Time `json:"sentAt"`
}

// CreateMessageRequest is the POST /messages/{conversationId} body. The
// conversation id comes from the path, not the body, so there is no way for
// the two to disagree.
type CreateMessageRequest struct {
	SenderID string `json:"senderId"`
	Content  string `json:"content"`
}

// Validate reports the first problem with the request, or nil.
func (r CreateMessageRequest) Validate() error {
	if strings.TrimSpace(r.SenderID) == "" {
		return &ValidationError{Field: "senderId", Message: "must not be empty"}
	}
	return validateContent(r.Content)
}

// UpdateMessageRequest is the PATCH /messages/{id} body — content edits only.
// A message's sender, conversation and timestamp are immutable.
type UpdateMessageRequest struct {
	Content string `json:"content"`
}

// Validate reports the first problem with the request, or nil.
func (r UpdateMessageRequest) Validate() error {
	return validateContent(r.Content)
}

func validateContent(content string) error {
	if strings.TrimSpace(content) == "" {
		return &ValidationError{Field: "content", Message: "must not be empty"}
	}
	if len(content) > MaxContentLength {
		return &ValidationError{
			Field:   "content",
			Message: fmt.Sprintf("must be at most %d characters", MaxContentLength),
		}
	}
	return nil
}

// NewMessage builds a persistable message from a validated request. Ids and
// timestamps are generated here rather than by the database so the in-memory
// and Postgres stores produce identical rows.
func NewMessage(conversationID string, req CreateMessageRequest) Message {
	return Message{
		ID:             NewID(),
		ConversationID: conversationID,
		SenderID:       req.SenderID,
		Content:        req.Content,
		SentAt:         time.Now().UTC(),
	}
}

// NewID returns a random RFC 4122 version 4 UUID string. Hand-rolled to keep
// the module's dependency list to the two that earn their place (a WebSocket
// implementation and a Postgres driver).
func NewID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		// crypto/rand.Read only fails if the system entropy source is broken,
		// which is not a condition this service can meaningfully continue past.
		panic(fmt.Sprintf("domain: cannot read random bytes: %v", err))
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant 10

	var out [36]byte
	hex.Encode(out[0:8], b[0:4])
	out[8] = '-'
	hex.Encode(out[9:13], b[4:6])
	out[13] = '-'
	hex.Encode(out[14:18], b[6:8])
	out[18] = '-'
	hex.Encode(out[19:23], b[8:10])
	out[23] = '-'
	hex.Encode(out[24:36], b[10:16])
	return string(out[:])
}
