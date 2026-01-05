package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"awsome-prompt/backend/internal/models"
)

// PromptRepository defines the interface for prompt data access.
type PromptRepository interface {
	Create(ctx context.Context, prompt *models.Prompt) error
	Get(ctx context.Context, id string) (*models.Prompt, error)
	List(ctx context.Context, limit, offset int, ownerID string) ([]*models.Prompt, error)
	Delete(ctx context.Context, id string) error
}

type promptRepository struct {
	db *sql.DB
}

// NewPromptRepository creates a new instance of PromptRepository.
func NewPromptRepository(db *sql.DB) PromptRepository {
	return &promptRepository{db: db}
}

// Create inserts a new prompt into the database.
func (r *promptRepository) Create(ctx context.Context, prompt *models.Prompt) error {
	query := `
		INSERT INTO prompts (template_id, version_id, owner_id, variables)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at`

	// Ensure variables is valid JSON
	if prompt.Variables == nil {
		prompt.Variables = json.RawMessage("[]")
	}

	err := r.db.QueryRowContext(ctx, query,
		prompt.TemplateID,
		prompt.VersionID,
		prompt.OwnerID,
		prompt.Variables,
	).Scan(&prompt.ID, &prompt.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert prompt: %w", err)
	}

	return nil
}

// Get retrieves a prompt by ID.
func (r *promptRepository) Get(ctx context.Context, id string) (*models.Prompt, error) {
	query := `
		SELECT id, template_id, version_id, owner_id, variables, created_at
		FROM prompts
		WHERE id = $1`

	var prompt models.Prompt
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&prompt.ID,
		&prompt.TemplateID,
		&prompt.VersionID,
		&prompt.OwnerID,
		&prompt.Variables,
		&prompt.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("prompt not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get prompt: %w", err)
	}

	return &prompt, nil
}

// List retrieves a list of prompts for a specific owner.
func (r *promptRepository) List(ctx context.Context, limit, offset int, ownerID string) ([]*models.Prompt, error) {
	query := `
		SELECT id, template_id, version_id, owner_id, variables, created_at
		FROM prompts
		WHERE owner_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, ownerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list prompts: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var prompts []*models.Prompt
	for rows.Next() {
		var p models.Prompt
		if err := rows.Scan(
			&p.ID,
			&p.TemplateID,
			&p.VersionID,
			&p.OwnerID,
			&p.Variables,
			&p.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan prompt: %w", err)
		}
		prompts = append(prompts, &p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return prompts, nil
}

// Delete removes a prompt from the database.
func (r *promptRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM prompts WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete prompt: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("prompt not found")
	}

	return nil
}
