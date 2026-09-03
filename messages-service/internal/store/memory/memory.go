// Package memory is an in-process MessageStore. It is the default backend so
// the service runs with no external dependencies, and it is what the HTTP
// tests exercise.
package memory

import (
	"context"
	"sort"
	"sync"

	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
	"github.com/harryemmett/harrys-project/messages-service/internal/store"
)

// Store keeps messages in maps guarded by a single RWMutex. Contention is a
// non-issue at the scale this backend is for; if it ever isn't, that's the
// signal to move to Postgres rather than to shard the lock.
type Store struct {
	mu sync.RWMutex
	// byID owns the messages; byConversation holds ids in insertion order.
	byID           map[string]domain.Message
	byConversation map[string][]string
}

// New returns an empty in-memory store.
func New() *Store {
	return &Store{
		byID:           make(map[string]domain.Message),
		byConversation: make(map[string][]string),
	}
}

var _ store.MessageStore = (*Store)(nil)

// ListByConversation returns up to page.Limit messages, newest first,
// optionally starting before a cursor timestamp.
func (s *Store) ListByConversation(_ context.Context, conversationID string, page store.Page) ([]domain.Message, error) {
	page = page.Normalise()

	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := s.byConversation[conversationID]
	out := make([]domain.Message, 0, len(ids))
	for _, id := range ids {
		msg := s.byID[id]
		if !page.Before.IsZero() && !msg.SentAt.Before(page.Before) {
			continue
		}
		out = append(out, msg)
	}

	// Newest first, with the id as a tiebreaker so messages written inside the
	// same clock tick still come back in a stable order.
	sort.Slice(out, func(i, j int) bool {
		if out[i].SentAt.Equal(out[j].SentAt) {
			return out[i].ID > out[j].ID
		}
		return out[i].SentAt.After(out[j].SentAt)
	})

	if len(out) > page.Limit {
		out = out[:page.Limit]
	}
	return out, nil
}

// Get returns one message by id.
func (s *Store) Get(_ context.Context, id string) (domain.Message, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	msg, ok := s.byID[id]
	if !ok {
		return domain.Message{}, domain.ErrNotFound
	}
	return msg, nil
}

// Create stores a message and returns it as persisted.
func (s *Store) Create(_ context.Context, msg domain.Message) (domain.Message, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.byID[msg.ID] = msg
	s.byConversation[msg.ConversationID] = append(s.byConversation[msg.ConversationID], msg.ID)
	return msg, nil
}

// Update replaces a message's content, leaving sender, conversation and
// timestamp untouched.
func (s *Store) Update(_ context.Context, id, content string) (domain.Message, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	msg, ok := s.byID[id]
	if !ok {
		return domain.Message{}, domain.ErrNotFound
	}
	msg.Content = content
	s.byID[id] = msg
	return msg, nil
}

// Delete removes a message.
func (s *Store) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	msg, ok := s.byID[id]
	if !ok {
		return domain.ErrNotFound
	}
	delete(s.byID, id)

	ids := s.byConversation[msg.ConversationID]
	for i, existing := range ids {
		if existing == id {
			s.byConversation[msg.ConversationID] = append(ids[:i], ids[i+1:]...)
			break
		}
	}
	if len(s.byConversation[msg.ConversationID]) == 0 {
		delete(s.byConversation, msg.ConversationID)
	}
	return nil
}

// Close is a no-op — there is nothing to release.
func (s *Store) Close() {}
