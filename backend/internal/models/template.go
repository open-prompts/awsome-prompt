package models

import (
	"database/sql"
	"time"

	"github.com/lib/pq"
)

// Template represents the template model in the database.
// It maps to the "templates" table.
type Template struct {
	ID          string         `json:"id"`
	OwnerID     string         `json:"owner_id"`
	Title       string         `json:"title"`
	Description sql.NullString `json:"description"`
	Visibility  string         `json:"visibility"`
	Type        string         `json:"type"`
	Tags        pq.StringArray `json:"tags"`
	Category    sql.NullString `json:"category"`
	LikedBy     pq.StringArray `json:"liked_by"`
	FavoritedBy pq.StringArray `json:"favorited_by"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// TemplateVersion represents a version of a template.
// It maps to the "template_versions" table.
type TemplateVersion struct {
	ID         int32     `json:"id"`
	TemplateID string    `json:"template_id"`
	Version    int32     `json:"version"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}
