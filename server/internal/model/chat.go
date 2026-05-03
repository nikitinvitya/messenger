package model

import "time"

type Chat struct {
	ID        int       `json:"id"`
	Name      *string   `json:"name,omitempty"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
	AvatarURL *string   `json:"avatarURL"`
}
