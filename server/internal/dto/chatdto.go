package dto

import (
	"time"

	"github.com/nikitinvitya/messenger/internal/model"
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
	AvatarURL    *string      `json:"avatarURL"`
	UnreadCount  int          `json:"unreadCount"`
}

type UserLeftPayload struct {
	ChatID int `json:"chatId"`
	UserID int `json:"userId"`
}

func (p *UserLeftPayload) GetChatID() int {
	return p.ChatID
}
