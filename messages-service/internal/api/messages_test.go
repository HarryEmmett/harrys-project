package api_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/harryemmett/harrys-project/messages-service/internal/api"
	"github.com/harryemmett/harrys-project/messages-service/internal/config"
	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
	"github.com/harryemmett/harrys-project/messages-service/internal/store/memory"
	"github.com/harryemmett/harrys-project/messages-service/internal/ws"
)

// newTestServer builds the real router over the in-memory store, so these
// exercise routing, middleware, validation and handlers together.
func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()

	cfg := config.Config{Addr: ":0", Store: config.BackendMemory, AllowedOrigins: []string{"*"}}
	srv := httptest.NewServer(api.NewRouter(cfg, memory.New(), ws.NewHub()))
	t.Cleanup(srv.Close)
	return srv
}

func post(t *testing.T, srv *httptest.Server, path string, body any) *http.Response {
	t.Helper()

	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	res, err := http.Post(srv.URL+path, "application/json", bytes.NewReader(raw))
	if err != nil {
		t.Fatalf("POST %s: %v", path, err)
	}
	t.Cleanup(func() { res.Body.Close() })
	return res
}

func decode[T any](t *testing.T, res *http.Response) T {
	t.Helper()

	var out T
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return out
}

func TestCreateMessageReturnsPersistedMessage(t *testing.T) {
	srv := newTestServer(t)

	res := post(t, srv, "/messages/conv-1", map[string]string{
		"senderId": "user-a",
		"content":  "hello",
	})
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want %d", res.StatusCode, http.StatusCreated)
	}

	msg := decode[domain.Message](t, res)
	if msg.ID == "" {
		t.Error("id was not generated")
	}
	if msg.ConversationID != "conv-1" {
		t.Errorf("conversationId = %q, want the path value %q", msg.ConversationID, "conv-1")
	}
	if msg.SenderID != "user-a" || msg.Content != "hello" {
		t.Errorf("got %+v, want senderId user-a and content hello", msg)
	}
	if msg.SentAt.IsZero() {
		t.Error("sentAt was not set")
	}
}

func TestListReturnsNewestFirstAndRespectsLimit(t *testing.T) {
	srv := newTestServer(t)

	for _, content := range []string{"first", "second", "third"} {
		if res := post(t, srv, "/messages/conv-1", map[string]string{
			"senderId": "user-a",
			"content":  content,
		}); res.StatusCode != http.StatusCreated {
			t.Fatalf("seeding %q: status %d", content, res.StatusCode)
		}
		// Timestamps come from the clock; nudge it so ordering is unambiguous.
		time.Sleep(time.Millisecond)
	}

	res, err := http.Get(srv.URL + "/messages/conv-1?limit=2")
	if err != nil {
		t.Fatalf("GET: %v", err)
	}
	defer res.Body.Close()

	body := decode[struct {
		Messages []domain.Message `json:"messages"`
	}](t, res)

	if len(body.Messages) != 2 {
		t.Fatalf("got %d messages, want 2 (limit)", len(body.Messages))
	}
	if body.Messages[0].Content != "third" || body.Messages[1].Content != "second" {
		t.Errorf("got %q then %q, want newest first: third then second",
			body.Messages[0].Content, body.Messages[1].Content)
	}
}

func TestListIsScopedToItsConversation(t *testing.T) {
	srv := newTestServer(t)

	post(t, srv, "/messages/conv-1", map[string]string{"senderId": "a", "content": "mine"})
	post(t, srv, "/messages/conv-2", map[string]string{"senderId": "b", "content": "theirs"})

	res, err := http.Get(srv.URL + "/messages/conv-1")
	if err != nil {
		t.Fatalf("GET: %v", err)
	}
	defer res.Body.Close()

	body := decode[struct {
		Messages []domain.Message `json:"messages"`
	}](t, res)

	if len(body.Messages) != 1 || body.Messages[0].Content != "mine" {
		t.Errorf("conv-1 returned %+v, want only its own message", body.Messages)
	}
}

func TestUnknownConversationReturnsEmptyList(t *testing.T) {
	srv := newTestServer(t)

	res, err := http.Get(srv.URL + "/messages/nope")
	if err != nil {
		t.Fatalf("GET: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200 — an empty conversation is not an error", res.StatusCode)
	}
	body := decode[struct {
		Messages []domain.Message `json:"messages"`
	}](t, res)
	if len(body.Messages) != 0 {
		t.Errorf("got %d messages, want 0", len(body.Messages))
	}
	// Encoded as [] rather than null so clients can map over it directly.
	if body.Messages == nil {
		t.Error("messages was null, want an empty array")
	}
}

func TestInvalidRequestsAreRejected(t *testing.T) {
	srv := newTestServer(t)

	tests := []struct {
		name string
		body any
	}{
		{"empty content", map[string]string{"senderId": "a", "content": ""}},
		{"whitespace-only content", map[string]string{"senderId": "a", "content": "   "}},
		{"missing senderId", map[string]string{"content": "hi"}},
		{"unknown field", map[string]string{"senderId": "a", "content": "hi", "author": "me"}},
		{"content too long", map[string]string{
			"senderId": "a",
			"content":  string(bytes.Repeat([]byte("x"), domain.MaxContentLength+1)),
		}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res := post(t, srv, "/messages/conv-1", tc.body)
			if res.StatusCode != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", res.StatusCode)
			}
			body := decode[struct {
				StatusCode int    `json:"statusCode"`
				Message    string `json:"message"`
			}](t, res)
			if body.StatusCode != http.StatusBadRequest || body.Message == "" {
				t.Errorf("error body = %+v, want a populated Nest-shaped error", body)
			}
		})
	}
}

func TestUpdateAndDelete(t *testing.T) {
	srv := newTestServer(t)

	created := decode[domain.Message](t, post(t, srv, "/messages/conv-1", map[string]string{
		"senderId": "user-a",
		"content":  "typo",
	}))

	patch := func(id string, body any) *http.Response {
		raw, _ := json.Marshal(body)
		req, err := http.NewRequest(http.MethodPatch, srv.URL+"/messages/"+id, bytes.NewReader(raw))
		if err != nil {
			t.Fatalf("build PATCH: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("PATCH: %v", err)
		}
		t.Cleanup(func() { res.Body.Close() })
		return res
	}

	res := patch(created.ID, map[string]string{"content": "fixed"})
	if res.StatusCode != http.StatusOK {
		t.Fatalf("PATCH status = %d, want 200", res.StatusCode)
	}
	updated := decode[domain.Message](t, res)
	if updated.Content != "fixed" {
		t.Errorf("content = %q, want %q", updated.Content, "fixed")
	}
	if !updated.SentAt.Equal(created.SentAt) || updated.SenderID != created.SenderID {
		t.Error("editing content must not change sentAt or senderId")
	}

	if res := patch("missing-id", map[string]string{"content": "x"}); res.StatusCode != http.StatusNotFound {
		t.Errorf("PATCH unknown id = %d, want 404", res.StatusCode)
	}

	del := func(id string) *http.Response {
		req, err := http.NewRequest(http.MethodDelete, srv.URL+"/messages/"+id, nil)
		if err != nil {
			t.Fatalf("build DELETE: %v", err)
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("DELETE: %v", err)
		}
		t.Cleanup(func() { res.Body.Close() })
		return res
	}

	if res := del(created.ID); res.StatusCode != http.StatusNoContent {
		t.Fatalf("DELETE status = %d, want 204", res.StatusCode)
	}
	if res := del(created.ID); res.StatusCode != http.StatusNotFound {
		t.Errorf("DELETE twice = %d, want 404", res.StatusCode)
	}
}

func TestHealthz(t *testing.T) {
	srv := newTestServer(t)

	res, err := http.Get(srv.URL + "/healthz")
	if err != nil {
		t.Fatalf("GET /healthz: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}
	if got := res.Header.Get("X-Request-Id"); got == "" {
		t.Error("X-Request-Id header was not set by the middleware")
	}
}

func TestCORSPreflight(t *testing.T) {
	srv := newTestServer(t)

	req, err := http.NewRequest(http.MethodOptions, srv.URL+"/messages/conv-1", nil)
	if err != nil {
		t.Fatalf("build OPTIONS: %v", err)
	}
	req.Header.Set("Origin", "http://localhost:5173")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("OPTIONS: %v", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusNoContent {
		t.Errorf("status = %d, want 204", res.StatusCode)
	}
	if got := res.Header.Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Access-Control-Allow-Origin = %q, want *", got)
	}
}
