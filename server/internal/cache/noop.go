package cache

import (
	"context"
	"time"
)

type noopCache struct{}

func NewNoop() Cache {
	return noopCache{}
}

func (noopCache) Enabled() bool { return false }

func (noopCache) Get(context.Context, string, any) (bool, error) {
	return false, nil
}

func (noopCache) Set(context.Context, string, any, time.Duration) error {
	return nil
}

func (noopCache) Delete(context.Context, ...string) error {
	return nil
}

func (noopCache) InvalidateUserChats(context.Context, ...int) error {
	return nil
}

func (noopCache) InvalidateUser(context.Context, int, string) error {
	return nil
}

func (noopCache) InvalidateChat(context.Context, int, []int) error {
	return nil
}
