package dto

import (
	"github.com/nikitinvitya/messenger/internal/model"
	"time"
)

type LastMessage struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatResponse struct {
	ID           int          `json:"id"`
	Name         *string      `json:"name,omitempty"`
	Type         string       `json:"type"`
	CreatedAt    time.Time    `json:"created_at"`
	Participants []model.User `json:"participants"`
	LastMessage  *LastMessage `json:"last_message,omitempty"`
}
