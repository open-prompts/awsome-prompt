package repository

import (
	"context"
	"database/sql"
	"fmt"

	"awsome-prompt/backend/internal/models"

	"github.com/lib/pq"
)

// TemplateRepository defines the interface for template data access.
type TemplateRepository interface {
	List(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*models.Template, error)
}

// templateRepository implements TemplateRepository.
type templateRepository struct {
	db *sql.DB
}

// NewTemplateRepository creates a new instance of TemplateRepository.
func NewTemplateRepository(db *sql.DB) TemplateRepository {
	return &templateRepository{db: db}
}

// List retrieves a list of templates based on filters and pagination.
func (r *templateRepository) List(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*models.Template, error) {
	query := `
		SELECT id, owner_id, title, description, visibility, type, tags, category, liked_by, favorited_by, created_at, updated_at
		FROM templates
		WHERE 1=1
	`
	var args []interface{}
	argID := 1

	if val, ok := filters["visibility"]; ok && val != "" {
		query += fmt.Sprintf(" AND visibility = $%d", argID)
		args = append(args, val)
		argID++
	}
	if val, ok := filters["owner_id"]; ok && val != "" {
		query += fmt.Sprintf(" AND owner_id = $%d", argID)
		args = append(args, val)
		argID++
	}
	if val, ok := filters["category"]; ok && val != "" {
		query += fmt.Sprintf(" AND category = $%d", argID)
		args = append(args, val)
		argID++
	}
	if val, ok := filters["tags"]; ok {
		tags := val.([]string)
		if len(tags) > 0 {
			query += fmt.Sprintf(" AND tags @> $%d", argID)
			args = append(args, pq.Array(tags))
			argID++
		}
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argID, argID+1)
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query templates: %w", err)
	}
	defer rows.Close()

	var templates []*models.Template
	for rows.Next() {
		var t models.Template
		if err := rows.Scan(
			&t.ID, &t.OwnerID, &t.Title, &t.Description, &t.Visibility, &t.Type,
			&t.Tags, &t.Category, &t.LikedBy, &t.FavoritedBy, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}
		templates = append(templates, &t)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return templates, nil
}
