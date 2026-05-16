package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

const defaultTTL = 5 * time.Minute

type redisCache struct {
	client *redis.Client
	ttl    time.Duration
}

func NewFromEnv() (Cache, error) {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		slog.Info("REDIS_URL not set, HTTP response cache disabled")
		return NewNoop(), nil
	}

	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("parse REDIS_URL: %w", err)
	}

	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}

	ttl := defaultTTL
	if raw := os.Getenv("CACHE_TTL_SECONDS"); raw != "" {
		seconds, err := strconv.Atoi(raw)
		if err == nil && seconds > 0 {
			ttl = time.Duration(seconds) * time.Second
		}
	}

	slog.Info("Redis cache enabled", "ttl", ttl.String())
	return &redisCache{client: client, ttl: ttl}, nil
}

func (c *redisCache) Enabled() bool { return true }

func (c *redisCache) Get(ctx context.Context, key string, dest any) (bool, error) {
	data, err := c.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if err := json.Unmarshal(data, dest); err != nil {
		_ = c.client.Del(ctx, key).Err()
		return false, err
	}
	return true, nil
}

func (c *redisCache) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	if ttl <= 0 {
		ttl = c.ttl
	}
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key, data, ttl).Err()
}

func (c *redisCache) Delete(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	return c.client.Del(ctx, keys...).Err()
}

func (c *redisCache) InvalidateUserChats(ctx context.Context, userIDs ...int) error {
	keys := make([]string, 0, len(userIDs))
	for _, id := range userIDs {
		keys = append(keys, UserChatsKey(id))
	}
	return c.Delete(ctx, keys...)
}

func (c *redisCache) InvalidateUser(ctx context.Context, userID int, username string) error {
	keys := []string{UserByIDKey(userID)}
	if username != "" {
		keys = append(keys, UserByUsernameKey(username))
	}
	return c.Delete(ctx, keys...)
}

func (c *redisCache) InvalidateChat(ctx context.Context, chatID int, viewerIDs []int) error {
	keys := make([]string, 0, len(viewerIDs))
	for _, id := range viewerIDs {
		keys = append(keys, ChatByIDKey(chatID, id))
	}
	return c.Delete(ctx, keys...)
}
