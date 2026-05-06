package model

import "time"

type Message struct {
	ID                  int        `json:"id"`
	ChatID              int        `json:"chatId"`
	SenderID            int        `json:"senderId"`
	Content             string     `json:"content"`
	CreatedAt           time.Time  `json:"createdAt"`
	EditedAt            *time.Time `json:"editedAt,omitempty"`
	ReplyToMessageID    *int       `json:"replyToMessageId,omitempty"`
	ForwardedFromUserID *int       `json:"forwardedFromUserId,omitempty"`
	ForwardedFromChatID *int       `json:"forwardedFromChatId,omitempty"`
	ImageURL            *string    `json:"imageURL,omitempty"`
	Type                string     `json:"type"`
}

func (m *Message) GetChatID() int {
	return m.ChatID
}

type DeletedMessagePayload struct {
	ID     int `json:"id"`
	ChatID int `json:"chatId"`
}

func (d *DeletedMessagePayload) GetChatID() int {
	return d.ChatID
}
