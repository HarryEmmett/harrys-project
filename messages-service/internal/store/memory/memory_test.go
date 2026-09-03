package memory_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
	"github.com/harryemmett/harrys-project/messages-service/internal/store"
	"github.com/harryemmett/harrys-project/messages-service/internal/store/memory"
)

func seed(t *testing.T, s *memory.Store, conversationID string, sentAt time.Time, content string) domain.Message {
	t.Helper()

	msg, err := s.Create(context.Background(), domain.Message{
		ID:             domain.NewID(),
		ConversationID: conversationID,
		SenderID:       "user-a",
		Content:        content,
		SentAt:         sentAt,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	return msg
}

func TestListPagesBackwardsThroughHistory(t *testing.T) {
	s := memory.New()
	base := time.Date(2026, 7, 30, 12, 0, 0, 0, time.UTC)

	for i, content := range []string{"one", "two", "three", "four"} {
		seed(t, s, "conv-1", base.Add(time.Duration(i)*time.Minute), content)
	}

	first, err := s.ListByConversation(context.Background(), "conv-1", store.Page{Limit: 2})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(first) != 2 || first[0].Content != "four" || first[1].Content != "three" {
		t.Fatalf("first page = %v, want four then three", contents(first))
	}

	// The cursor is exclusive, so the next page starts strictly older.
	second, err := s.ListByConversation(context.Background(), "conv-1", store.Page{
		Limit:  2,
		Before: first[len(first)-1].SentAt,
	})
	if err != nil {
		t.Fatalf("list page 2: %v", err)
	}
	if len(second) != 2 || second[0].Content != "two" || second[1].Content != "one" {
		t.Fatalf("second page = %v, want two then one", contents(second))
	}
}

func TestListClampsLimit(t *testing.T) {
	s := memory.New()
	base := time.Now().UTC()

	for i := 0; i < store.MaxPageLimit+10; i++ {
		seed(t, s, "conv-1", base.Add(time.Duration(i)*time.Millisecond), "x")
	}

	got, err := s.ListByConversation(context.Background(), "conv-1", store.Page{Limit: 10_000})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(got) != store.MaxPageLimit {
		t.Errorf("got %d messages, want the %d cap", len(got), store.MaxPageLimit)
	}
}

func TestGetUpdateDeleteMissingIDReturnNotFound(t *testing.T) {
	s := memory.New()
	ctx := context.Background()

	if _, err := s.Get(ctx, "nope"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Get error = %v, want ErrNotFound", err)
	}
	if _, err := s.Update(ctx, "nope", "x"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Update error = %v, want ErrNotFound", err)
	}
	if err := s.Delete(ctx, "nope"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Delete error = %v, want ErrNotFound", err)
	}
}

func TestDeleteRemovesFromItsConversation(t *testing.T) {
	s := memory.New()
	ctx := context.Background()
	msg := seed(t, s, "conv-1", time.Now().UTC(), "bye")

	if err := s.Delete(ctx, msg.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	got, err := s.ListByConversation(ctx, "conv-1", store.Page{})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(got) != 0 {
		t.Errorf("conversation still holds %v", contents(got))
	}
}

// The store is shared by every request goroutine and by the WebSocket pumps,
// so run this package with -race in CI.
func TestConcurrentAccessIsSafe(t *testing.T) {
	s := memory.New()
	ctx := context.Background()

	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(2)
		go func() {
			defer wg.Done()
			// Not seed(): t.Fatalf may only be called from the test goroutine.
			_, err := s.Create(ctx, domain.Message{
				ID:             domain.NewID(),
				ConversationID: "conv-1",
				SenderID:       "user-a",
				Content:        "concurrent",
				SentAt:         time.Now().UTC(),
			})
			if err != nil {
				t.Errorf("create: %v", err)
			}
		}()
		go func() {
			defer wg.Done()
			if _, err := s.ListByConversation(ctx, "conv-1", store.Page{}); err != nil {
				t.Errorf("list: %v", err)
			}
		}()
	}
	wg.Wait()
}

func contents(messages []domain.Message) []string {
	out := make([]string, len(messages))
	for i, m := range messages {
		out[i] = m.Content
	}
	return out
}
