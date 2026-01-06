package data

import (
	"database/sql"
	"fmt"

	"go.uber.org/zap"

	_ "github.com/lib/pq" // Import postgres driver
)

// PostgresConnection holds the database connection.
type PostgresConnection struct {
	DB *sql.DB
}

// NewPostgresConnection initializes a new Postgres connection.
// It opens a connection to the database and pings it to verify connectivity.
func NewPostgresConnection(dsn string) (*PostgresConnection, error) {
	zap.S().Info("Connecting to Postgres...")
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	zap.S().Info("Successfully connected to the database")
	return &PostgresConnection{DB: db}, nil
}
