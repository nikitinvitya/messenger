package cache

import (
	"context"
	"time"
)

// Cache stores JSON-serialized API responses. Noop when Redis is not configured.
type Cache interface {
	Enabled() bool
	Get(ctx context.Context, key string, dest any) (bool, error)
	Set(ctx context.Context, key string, value any, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	InvalidateUserChats(ctx context.Context, userIDs ...int) error
	InvalidateUser(ctx context.Context, userID int, username string) error
	InvalidateChat(ctx context.Context, chatID int, viewerIDs []int) error
}
