package model

import "time"

type Message struct {
	ID        int        `json:"id"`
	ChatID    int        `json:"chat_id"`
	SenderID  int        `json:"sender_id"`
	Content   string     `json:"content"`
	CreatedAt time.Time  `json:"created_at"`
	EditedAt  *time.Time `json:"edited_at,omitempty"`
}
