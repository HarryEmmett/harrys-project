package domain

import (
	"errors"
	"fmt"
)

// ErrNotFound is returned by stores when a requested row does not exist. The
// HTTP layer maps it to 404 so handlers never have to know about storage
// specifics like pgx.ErrNoRows.
var ErrNotFound = errors.New("not found")

// ValidationError describes a request field that failed validation. The HTTP
// layer maps it to 400.
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s %s", e.Field, e.Message)
}
