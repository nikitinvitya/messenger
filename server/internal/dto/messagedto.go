package dto

import "time"

type SenderInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
}

type MessageResponse struct {
	ID                  int         `json:"id"`
	ChatID              int         `json:"chatId"`
	Content             string      `json:"content"`
	CreatedAt           time.Time   `json:"createdAt"`
	EditedAt            *time.Time  `json:"editedAt,omitempty"`
	ReplyToMessageID    *int        `json:"replyToMessageId,omitempty"`
	ForwardedFromUserID *int        `json:"forwardedFromUserId,omitempty"`
	ForwardedFromChatID *int        `json:"forwardedFromChatId,omitempty"`
	Sender              *SenderInfo `json:"sender"`
	ImageURL            *string     `json:"imageURL,omitempty"`
	Type                string      `json:"type"`
}

func (m *MessageResponse) GetChatID() int {
	return m.ChatID
}

type ListMessagesResponse struct {
	Messages    []*MessageResponse `json:"messages"`
	BlockStatus string             `json:"blockStatus"`
}
