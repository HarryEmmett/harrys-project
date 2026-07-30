package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/harryemmett/harrys-project/messages-service/internal/domain"
)

// errorBody mirrors NestJS's default exception shape
// (`{ statusCode, message, error }`) so the frontend can handle failures from
// this service and from server/ with the same code path.
type errorBody struct {
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
	Error      string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		// The status line is already sent, so there is nothing to salvage —
		// log it and let the client see a truncated body.
		slog.Error("write response body", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorBody{
		StatusCode: status,
		Message:    message,
		Error:      http.StatusText(status),
	})
}

// writeStoreError maps a store/domain error onto a status code. Anything
// unrecognised is a 500 with a generic message — internal errors are logged,
// never echoed to the client.
func writeStoreError(w http.ResponseWriter, err error, notFoundMessage string) {
	var invalid *domain.ValidationError
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(w, http.StatusNotFound, notFoundMessage)
	case errors.As(err, &invalid):
		writeError(w, http.StatusBadRequest, invalid.Error())
	default:
		slog.Error("request failed", "error", err)
		writeError(w, http.StatusInternalServerError, "Internal server error")
	}
}
