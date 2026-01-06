package data

import "go.uber.org/zap"

// RedisClient holds the redis client
type RedisClient struct {
	// Add redis client field here
}

// NewRedisClient initializes a new Redis client
func NewRedisClient(addr string) (*RedisClient, error) {
	zap.S().Infof("Initializing Redis client to %s", addr)
	// Initialize Redis client
	return &RedisClient{}, nil
}
