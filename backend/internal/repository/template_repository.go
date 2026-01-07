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
	Create(ctx context.Context, template *models.Template) error
	Update(ctx context.Context, template *models.Template) error
	Delete(ctx context.Context, id string) error
	Get(ctx context.Context, id string) (*models.Template, error)
	ListCategories(ctx context.Context, filters map[string]interface{}) ([]*models.CategoryStat, error)
	ListTags(ctx context.Context, filters map[string]interface{}) ([]*models.TagStat, error)
}

// templateRepository implements TemplateRepository.
type templateRepository struct {
	db *sql.DB
}

// NewTemplateRepository creates a new instance of TemplateRepository.
func NewTemplateRepository(db *sql.DB) TemplateRepository {
	return &templateRepository{db: db}
}

// Create inserts a new template into the database.
func (r *templateRepository) Create(ctx context.Context, t *models.Template) error {
	query := `
		INSERT INTO templates (
			owner_id, title, description, visibility, type, tags, category, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9
		) RETURNING id
	`
	err := r.db.QueryRowContext(ctx, query,
		t.OwnerID, t.Title, t.Description, t.Visibility, t.Type, pq.Array(t.Tags), t.Category, t.CreatedAt, t.UpdatedAt,
	).Scan(&t.ID)
	if err != nil {
		return fmt.Errorf("failed to create template: %w", err)
	}
	return nil
}

// Update updates an existing template in the database.
func (r *templateRepository) Update(ctx context.Context, t *models.Template) error {
	query := `
		UPDATE templates
		SET title = $1, description = $2, visibility = $3, tags = $4, category = $5, updated_at = $6
		WHERE id = $7
	`
	_, err := r.db.ExecContext(ctx, query,
		t.Title, t.Description, t.Visibility, pq.Array(t.Tags), t.Category, t.UpdatedAt, t.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update template: %w", err)
	}
	return nil
}

// Delete removes a template from the database.
func (r *templateRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM templates WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}
	return nil
}

// Get retrieves a template by ID.
func (r *templateRepository) Get(ctx context.Context, id string) (*models.Template, error) {
	query := `
		SELECT id, owner_id, title, description, visibility, type, tags, category, liked_by, favorited_by, created_at, updated_at
		FROM templates
		WHERE id = $1
	`
	var t models.Template
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&t.ID, &t.OwnerID, &t.Title, &t.Description, &t.Visibility, &t.Type,
		&t.Tags, &t.Category, &t.LikedBy, &t.FavoritedBy, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("template not found")
		}
		return nil, fmt.Errorf("failed to get template: %w", err)
	}
	return &t, nil
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

	fmt.Printf("List Query: %s, Args: %v\n", query, args)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query templates: %w", err)
	}
	defer func() {
		_ = rows.Close()
	}()

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

// ListCategories retrieves all categories and their template counts.
func (r *templateRepository) ListCategories(ctx context.Context, filters map[string]interface{}) ([]*models.CategoryStat, error) {
	query := `
		SELECT category, COUNT(*) as count
		FROM templates
		WHERE category IS NOT NULL AND category != ''
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
	}

	query += `
		GROUP BY category
		ORDER BY count DESC
	`
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var stats []*models.CategoryStat
	for rows.Next() {
		var s models.CategoryStat
		if err := rows.Scan(&s.Name, &s.Count); err != nil {
			return nil, fmt.Errorf("failed to scan category stat: %w", err)
		}
		stats = append(stats, &s)
	}
	return stats, nil
}

// ListTags retrieves all tags and their template counts.
func (r *templateRepository) ListTags(ctx context.Context, filters map[string]interface{}) ([]*models.TagStat, error) {
	var args []interface{}
	argID := 1

	// Note: unnesting happens in select, filtering needs to happen on the row before or after?
	// If we filter templates first, then unnest, we count tags of visible templates.
	// Correct approach:
	// SELECT t.tag, COUNT(*) FROM (SELECT unnest(tags) as tag FROM templates WHERE ...) t GROUP BY t.tag

	// Re-writing query for safety with filters
	whereClause := ""
	if val, ok := filters["visibility"]; ok && val != "" {
		whereClause += fmt.Sprintf(" AND visibility = $%d", argID)
		args = append(args, val)
		argID++
	}
	if val, ok := filters["owner_id"]; ok && val != "" {
		whereClause += fmt.Sprintf(" AND owner_id = $%d", argID)
		args = append(args, val)
	}

	query := fmt.Sprintf(`
		SELECT tag, COUNT(*) as count
		FROM (
			SELECT unnest(tags) as tag
			FROM templates
			WHERE 1=1 %s
		) as t
		GROUP BY tag
		ORDER BY count DESC
	`, whereClause)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list tags: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var stats []*models.TagStat
	for rows.Next() {
		var s models.TagStat
		if err := rows.Scan(&s.Name, &s.Count); err != nil {
			return nil, fmt.Errorf("failed to scan tag stat: %w", err)
		}
		stats = append(stats, &s)
	}
	return stats, nil
}
