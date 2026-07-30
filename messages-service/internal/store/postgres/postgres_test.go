package postgres_test

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
	"github.com/harryemmett/harrys-project/messages-service/internal/store"
	"github.com/harryemmett/harrys-project/messages-service/internal/store/postgres"
)

// These tests need a real database — the SQL, the uuid/timestamptz round-trip
// and the pgx.ErrNoRows mapping are exactly what a fake would fail to catch.
// They skip unless TEST_DATABASE_URL is set:
//
//	createdb messages_test
//	psql "$TEST_DATABASE_URL" -f schema.sql
//	TEST_DATABASE_URL=postgres://... go test ./internal/store/postgres/
func newTestStore(t *testing.T) *postgres.Store {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set — skipping Postgres integration tests")
	}

	s, err := postgres.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(s.Close)
	return s
}

// newMessage builds a message in its own conversation, so tests sharing a
// database never see each other's rows.
func newMessage(conversationID, content string, sentAt time.Time) domain.Message {
	return domain.Message{
		ID:             domain.NewID(),
		ConversationID: conversationID,
		SenderID:       "user-a",
		Content:        content,
		SentAt:         sentAt,
	}
}

func TestCreateAndGetRoundTrip(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	// Truncated to microseconds: that is all timestamptz stores, so comparing
	// against a nanosecond-precision time.Now would fail for the wrong reason.
	sentAt := time.Now().UTC().Truncate(time.Microsecond)
	want := newMessage(domain.NewID(), "hello", sentAt)

	created, err := s.Create(ctx, want)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if created.ID != want.ID || created.Content != want.Content || created.SenderID != want.SenderID {
		t.Errorf("created = %+v, want %+v", created, want)
	}
	if !created.SentAt.Equal(sentAt) {
		t.Errorf("sentAt = %v, want %v", created.SentAt, sentAt)
	}

	got, err := s.Get(ctx, want.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.ID != want.ID || got.ConversationID != want.ConversationID {
		t.Errorf("get returned %+v, want %+v", got, want)
	}
}

func TestListIsNewestFirstAndPagesByCursor(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	conversationID := domain.NewID()
	base := time.Now().UTC().Truncate(time.Microsecond)
	for i, content := range []string{"one", "two", "three", "four"} {
		if _, err := s.Create(ctx, newMessage(conversationID, content, base.Add(time.Duration(i)*time.Minute))); err != nil {
			t.Fatalf("seed %q: %v", content, err)
		}
	}

	first, err := s.ListByConversation(ctx, conversationID, store.Page{Limit: 2})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(first) != 2 || first[0].Content != "four" || first[1].Content != "three" {
		t.Fatalf("first page = %+v, want four then three", first)
	}

	second, err := s.ListByConversation(ctx, conversationID, store.Page{
		Limit:  2,
		Before: first[len(first)-1].SentAt,
	})
	if err != nil {
		t.Fatalf("list page 2: %v", err)
	}
	if len(second) != 2 || second[0].Content != "two" || second[1].Content != "one" {
		t.Fatalf("second page = %+v, want two then one", second)
	}
}

func TestListScopesToItsConversation(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mine, theirs := domain.NewID(), domain.NewID()
	now := time.Now().UTC().Truncate(time.Microsecond)
	if _, err := s.Create(ctx, newMessage(mine, "mine", now)); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if _, err := s.Create(ctx, newMessage(theirs, "theirs", now)); err != nil {
		t.Fatalf("seed: %v", err)
	}

	got, err := s.ListByConversation(ctx, mine, store.Page{})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(got) != 1 || got[0].Content != "mine" {
		t.Errorf("got %+v, want only this conversation's message", got)
	}
}

func TestUpdateChangesOnlyContent(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	created, err := s.Create(ctx, newMessage(domain.NewID(), "typo", time.Now().UTC().Truncate(time.Microsecond)))
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	updated, err := s.Update(ctx, created.ID, "fixed")
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Content != "fixed" {
		t.Errorf("content = %q, want fixed", updated.Content)
	}
	if !updated.SentAt.Equal(created.SentAt) || updated.SenderID != created.SenderID {
		t.Error("update must leave sentAt and senderId untouched")
	}
}

func TestDeleteRemovesTheRow(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	created, err := s.Create(ctx, newMessage(domain.NewID(), "bye", time.Now().UTC().Truncate(time.Microsecond)))
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := s.Delete(ctx, created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := s.Get(ctx, created.ID); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("get after delete = %v, want ErrNotFound", err)
	}
}

// pgx.ErrNoRows must never leak past the store — handlers map only
// domain.ErrNotFound to a 404.
func TestMissingIDMapsToErrNotFound(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	missing := domain.NewID()

	if _, err := s.Get(ctx, missing); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Get = %v, want ErrNotFound", err)
	}
	if _, err := s.Update(ctx, missing, "x"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Update = %v, want ErrNotFound", err)
	}
	if err := s.Delete(ctx, missing); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Delete = %v, want ErrNotFound", err)
	}
}
