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
