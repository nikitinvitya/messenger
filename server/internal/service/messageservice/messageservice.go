package messageservice

import (
	"context"
	"errors"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
	"github.com/nikitinvitya/messenger/internal/repository/messagerepository"
	"github.com/nikitinvitya/messenger/internal/websocket"
	"github.com/nikitinvitya/messenger/pkg/utils"
)

var (
	ErrAccessDenied    = errors.New("access to the resource is denied")
	ErrMessageNotFound = errors.New("message not found")
)

type MessageService interface {
	CreateMessage(ctx context.Context, senderID, chatID int, content string) (*model.Message, error)
	ListMessagesInChat(ctx context.Context, userID, chatID, limit, offset int) ([]model.Message, error)
	UpdateMessage(ctx context.Context, userID, messageID int, newContent string) (*model.Message, error)
}

type messageService struct {
	chatRepo    chatrepository.ChatRepository
	messageRepo messagerepository.MessageRepository
	hub         *websocket.Hub
}

func NewMessageService(chatRepo chatrepository.ChatRepository, messageRepo messagerepository.MessageRepository, hub *websocket.Hub) MessageService {
	return &messageService{
		chatRepo:    chatRepo,
		messageRepo: messageRepo,
		hub:         hub,
	}
}

func (s *messageService) CreateMessage(ctx context.Context, senderID, chatID int, content string) (*model.Message, error) {
	isParticipant, err := s.chatRepo.IsUserInChat(ctx, senderID, chatID)
	if err != nil {
		return nil, err
	}

	if !isParticipant {
		return nil, ErrAccessDenied
	}

	message := &model.Message{
		SenderID: senderID,
		ChatID:   chatID,
		Content:  content,
	}

	messageID, err := s.messageRepo.CreateMessage(ctx, message)
	if err != nil {
		return nil, err
	}
	message.ID = messageID

	finalMessage, err := s.messageRepo.GetMessageByID(ctx, message.ID)
	if err != nil {
		return nil, err
	}

	s.hub.Broadcast <- finalMessage

	return finalMessage, nil
}

func (s *messageService) ListMessagesInChat(ctx context.Context, userID, chatID, limit, offset int) ([]model.Message, error) {
	isParticipant, err := s.chatRepo.IsUserInChat(ctx, userID, chatID)
	if err != nil {
		return nil, err
	}

	if !isParticipant {
		return nil, ErrAccessDenied
	}

	messages, err := s.messageRepo.ListMessagesInChat(ctx, chatID, limit, offset)
	if err != nil {
		return nil, err
	}
	utils.Reverse(messages)

	return messages, nil
}

func (s *messageService) UpdateMessage(ctx context.Context, userID, messageID int, newContent string) (*model.Message, error) {
	message, err := s.messageRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		return nil, err
	}

	if message == nil {
		return nil, ErrMessageNotFound
	}

	if message.SenderID != userID {
		return nil, ErrAccessDenied
	}

	if err = s.messageRepo.UpdateMessage(ctx, messageID, newContent); err != nil {
		return nil, err
	}

	message, err = s.messageRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		return nil, err
	}

	return message, nil
}
