package dto

import (
	"github.com/nikitinvitya/messenger/internal/model"
	"time"
)

type LastMessage struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

type ChatResponse struct {
	ID           int          `json:"id"`
	Name         *string      `json:"name,omitempty"`
	Type         string       `json:"type"`
	CreatedAt    time.Time    `json:"createdAt"`
	Participants []model.User `json:"participants"`
	LastMessage  *LastMessage `json:"lastMessage,omitempty"`
}
