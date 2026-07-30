// Package store defines the persistence seam for the service. Handlers depend
// on the MessageStore interface, never on a concrete backend, so swapping
// memory for Postgres is a wiring change in main and nothing else.
package store

import (
	"context"
	"time"

	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
)

// DefaultPageLimit and MaxPageLimit bound conversation history reads so one
// request can never try to load an unbounded chat log.
const (
	DefaultPageLimit = 50
	MaxPageLimit     = 200
)

// Page is a keyset (cursor) page over a conversation's history, newest first.
// Before is exclusive; the zero value means "start at the newest message".
// Keyset beats OFFSET here because new messages arrive constantly — an offset
// page would silently skip or repeat rows as the tail grows.
type Page struct {
	Limit  int
	Before time.Time
}

// Normalise clamps a caller-supplied page into the supported range.
func (p Page) Normalise() Page {
	if p.Limit <= 0 {
		p.Limit = DefaultPageLimit
	}
	if p.Limit > MaxPageLimit {
		p.Limit = MaxPageLimit
	}
	return p
}

// MessageStore persists messages. Implementations must return
// domain.ErrNotFound (not a backend-specific error) when a message id does not
// exist, and must return messages newest-first from ListByConversation.
type MessageStore interface {
	ListByConversation(ctx context.Context, conversationID string, page Page) ([]domain.Message, error)
	Get(ctx context.Context, id string) (domain.Message, error)
	Create(ctx context.Context, msg domain.Message) (domain.Message, error)
	Update(ctx context.Context, id, content string) (domain.Message, error)
	Delete(ctx context.Context, id string) error
	// Close releases backend resources. Safe to call once, at shutdown.
	Close()
}
