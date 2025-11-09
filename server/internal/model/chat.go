package model

import "time"

type Chat struct {
	ID        int       `json:"id"`
	Name      *string   `json:"name,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatParticipant struct {
	ID     int `json:"id"`
	ChatID int `json:"chat_id"`
	UserID int `json:"user_id"`
}
