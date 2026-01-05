package models

import (
	"encoding/json"
	"time"
)

// Prompt represents the prompt model in the database.
// It maps to the "prompts" table.
type Prompt struct {
	ID         string          `json:"id"`
	TemplateID string          `json:"template_id"`
	VersionID  int32           `json:"version_id"`
	OwnerID    string          `json:"owner_id"`
	Variables  json.RawMessage `json:"variables"` // Stored as JSONB in DB
	CreatedAt  time.Time       `json:"created_at"`
}

// PromptVariables is a helper struct to parse the Variables JSON.
type PromptVariables []string
