package model

import "time"

type BlocklistEntry struct {
	ID        int       `json:"id"`
	BlockerID int       `json:"blocker_id"`
	BlockedID int       `json:"blocked_id"`
	CreatedAt time.Time `json:"created_at"`
}
