package dto

import "time"

type SenderInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
}

type MessageResponse struct {
	ID                  int         `json:"id"`
	ChatID              int         `json:"chat_id"`
	Content             string      `json:"content"`
	CreatedAt           time.Time   `json:"created_at"`
	EditedAt            *time.Time  `json:"edited_at,omitempty"`
	ReplyToMessageID    *int        `json:"reply_to_message_id,omitempty"`
	ForwardedFromUserID *int        `json:"forwarded_from_user_id,omitempty"`
	ForwardedFromChatID *int        `json:"forwarded_from_chat_id,omitempty"`
	Sender              *SenderInfo `json:"sender"`
}

func (m *MessageResponse) GetChatID() int {
	return m.ChatID
}

type ListMessagesResponse struct {
	Messages    []*MessageResponse `json:"messages"`
	BlockStatus string             `json:"block_status"`
}
