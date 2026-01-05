package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"awsome-prompt/backend/internal/models"
)

var (
	ErrUserNotFound = errors.New("user not found")
)

type UserRepository interface {
	Insert(ctx context.Context, user *models.User) error
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id string) (*models.User, error)
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Insert(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, email, mobile, password_hash, display_name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at`

	args := []interface{}{
		user.ID,
		user.Email,
		user.Mobile,
		user.PasswordHash,
		user.DisplayName,
		time.Now(),
		time.Now(),
	}

	return r.db.QueryRowContext(ctx, query, args...).Scan(&user.CreatedAt, &user.UpdatedAt)
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, mobile, password_hash, display_name, created_at, updated_at
		FROM users
		WHERE email = $1`

	var user models.User
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Mobile,
		&user.PasswordHash,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT id, email, mobile, password_hash, display_name, created_at, updated_at
		FROM users
		WHERE id = $1`

	var user models.User
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Mobile,
		&user.PasswordHash,
		&user.DisplayName,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}
