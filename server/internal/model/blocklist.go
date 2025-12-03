package model

import "time"

type BlocklistEntry struct {
	ID        int       `json:"id"`
	BlockerID int       `json:"blockerId"`
	BlockedID int       `json:"blockedId"`
	CreatedAt time.Time `json:"createdAt"`
}
