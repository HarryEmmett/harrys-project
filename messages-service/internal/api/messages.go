package api

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
	"github.com/harryemmett/harrys-project/messages-service/internal/store"
	"github.com/harryemmett/harrys-project/messages-service/internal/ws"
)

// maxBodyBytes caps a request body well above MaxContentLength, so an
// oversized-but-plausible body still gets a readable validation error while a
// hostile one is cut off early.
const maxBodyBytes = 64 * 1024

// messagesHandler holds the two collaborators a request needs: the store and
// the hub.
//
// Layering rule, same as the Nest gateways in server/: persist first, then
// broadcast *the value the store returned* — never the raw request body. That
// way every client sees exactly what was saved, ids and timestamps included.
type messagesHandler struct {
	store store.MessageStore
	hub   *ws.Hub
}

// messagesResponse wraps the list the same way the games-service wraps its
// collections (`{ "games": [...] }`), leaving room to add pagination metadata
// without breaking clients.
type messagesResponse struct {
	Messages []domain.Message `json:"messages"`
}

// deletedMessage is the message-deleted payload: enough for a client to drop
// the message from its cache, without resurrecting content it just unsent.
type deletedMessage struct {
	ID             string `json:"id"`
	ConversationID string `json:"conversationId"`
}

// list handles GET /messages/{conversationId}.
//
// Query params: ?limit=1..200 (default 50), ?before=<RFC3339> for the next
// page. Messages come back newest first.
func (h *messagesHandler) list(w http.ResponseWriter, r *http.Request) {
	conversationID := r.PathValue("conversationId")

	page, err := pageFromQuery(r)
	if err != nil {
		writeStoreError(w, err, "")
		return
	}

	messages, err := h.store.ListByConversation(r.Context(), conversationID, page)
	if err != nil {
		writeStoreError(w, err, "Conversation not found")
		return
	}
	writeJSON(w, http.StatusOK, messagesResponse{Messages: messages})
}

// create handles POST /messages/{conversationId}.
func (h *messagesHandler) create(w http.ResponseWriter, r *http.Request) {
	conversationID := r.PathValue("conversationId")

	req, err := decodeBody[domain.CreateMessageRequest](w, r)
	if err != nil {
		writeStoreError(w, err, "")
		return
	}
	if err := req.Validate(); err != nil {
		writeStoreError(w, err, "")
		return
	}

	saved, err := h.store.Create(r.Context(), domain.NewMessage(conversationID, req))
	if err != nil {
		writeStoreError(w, err, "")
		return
	}

	h.hub.Broadcast(conversationID, ws.MessageAddedEvent, saved)
	writeJSON(w, http.StatusCreated, saved)
}

// update handles PATCH /messages/{id} — editing a message's content.
func (h *messagesHandler) update(w http.ResponseWriter, r *http.Request) {
	req, err := decodeBody[domain.UpdateMessageRequest](w, r)
	if err != nil {
		writeStoreError(w, err, "")
		return
	}
	if err := req.Validate(); err != nil {
		writeStoreError(w, err, "")
		return
	}

	saved, err := h.store.Update(r.Context(), r.PathValue("id"), req.Content)
	if err != nil {
		writeStoreError(w, err, "Message not found")
		return
	}

	h.hub.Broadcast(saved.ConversationID, ws.MessageUpdatedEvent, saved)
	writeJSON(w, http.StatusOK, saved)
}

// remove handles DELETE /messages/{id} — unsending a message.
func (h *messagesHandler) remove(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	// Read it first: once the row is gone there is no conversation id left to
	// scope the broadcast to.
	existing, err := h.store.Get(r.Context(), id)
	if err != nil {
		writeStoreError(w, err, "Message not found")
		return
	}
	if err := h.store.Delete(r.Context(), id); err != nil {
		writeStoreError(w, err, "Message not found")
		return
	}

	h.hub.Broadcast(existing.ConversationID, ws.MessageDeletedEvent, deletedMessage{
		ID:             existing.ID,
		ConversationID: existing.ConversationID,
	})
	w.WriteHeader(http.StatusNoContent)
}

// pageFromQuery parses ?limit and ?before into a store.Page.
func pageFromQuery(r *http.Request) (store.Page, error) {
	page := store.Page{}

	if raw := r.URL.Query().Get("limit"); raw != "" {
		limit, err := strconv.Atoi(raw)
		if err != nil || limit < 1 {
			return page, &domain.ValidationError{Field: "limit", Message: "must be a positive integer"}
		}
		page.Limit = limit
	}

	if raw := r.URL.Query().Get("before"); raw != "" {
		before, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return page, &domain.ValidationError{Field: "before", Message: "must be an RFC 3339 timestamp"}
		}
		page.Before = before
	}

	return page.Normalise(), nil
}

// decodeBody reads a JSON body into T, rejecting unknown fields — the
// equivalent of the `.strict()` on the zod schemas in shared/apiSchema.ts, so
// a typo in a field name fails loudly instead of being silently ignored.
func decodeBody[T any](w http.ResponseWriter, r *http.Request) (T, error) {
	var body T

	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	dec.DisallowUnknownFields()

	if err := dec.Decode(&body); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			return body, &domain.ValidationError{Field: "body", Message: "is too large"}
		}
		return body, &domain.ValidationError{Field: "body", Message: "is not valid JSON for this endpoint"}
	}
	// Exactly one JSON value per request — trailing content means the client
	// sent something other than what it thinks it did.
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return body, &domain.ValidationError{Field: "body", Message: "must contain a single JSON object"}
	}

	return body, nil
}
