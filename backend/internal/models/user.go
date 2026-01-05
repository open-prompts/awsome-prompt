package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID           string         `json:"id"`
	Email        string         `json:"email"`
	Mobile       sql.NullString `json:"mobile"`
	PasswordHash string         `json:"-"`
	DisplayName  string         `json:"display_name"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}
