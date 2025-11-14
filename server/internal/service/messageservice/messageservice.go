package messageservice

import (
	"context"
	"errors"
	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
	"github.com/nikitinvitya/messenger/internal/repository/messagerepository"
	"github.com/nikitinvitya/messenger/internal/service/blocklistservice"
	"github.com/nikitinvitya/messenger/internal/websocket"
	"github.com/nikitinvitya/messenger/pkg/utils"
)

var (
	ErrAccessDenied         = errors.New("access to the resource is denied")
	ErrMessageNotFound      = errors.New("message not found")
	ErrChatNotFound         = errors.New("chat not found")
	ErrUserBlocked          = errors.New("user is blocked")
	ErrCannotReplyToMessage = errors.New("you can't reply to this message")
)

type MessageService interface {
	CreateMessage(ctx context.Context, senderID, chatID int, content string, replyToMessageID *int) (*model.Message, error)
	ListMessagesInChat(ctx context.Context, userID, chatID, limit, offset int) (*dto.ListMessagesResponse, error)
	UpdateMessage(ctx context.Context, userID, messageID int, newContent string) (*model.Message, error)
	DeleteMessage(ctx context.Context, userID, messageID int) (*model.Message, error)
	ForwardMessage(ctx context.Context, forwarderID, destinationChatID int, messageIDs []int) error
}

type messageService struct {
	chatRepo     chatrepository.ChatRepository
	messageRepo  messagerepository.MessageRepository
	hub          *websocket.Hub
	blockService blocklistservice.BlocklistService
}

func NewMessageService(chatRepo chatrepository.ChatRepository, messageRepo messagerepository.MessageRepository, hub *websocket.Hub, blockService blocklistservice.BlocklistService) MessageService {
	return &messageService{
		chatRepo:     chatRepo,
		messageRepo:  messageRepo,
		hub:          hub,
		blockService: blockService,
	}
}

func (s *messageService) CreateMessage(ctx context.Context, senderID, chatID int, content string, replyToMessageID *int) (*model.Message, error) {
	chat, err := s.chatRepo.GetChatByID(ctx, chatID)
	if err != nil {
		return nil, err
	}

	if chat == nil {
		return nil, ErrChatNotFound
	}

	if chat.Type == "private" {
		participantIDs, err := s.chatRepo.ListChatParticipantsID(ctx, chatID)
		if err != nil {
			return nil, err
		}

		if len(participantIDs) > 1 {
			var recipientID int
			for _, id := range participantIDs {
				if id != senderID {
					recipientID = id
					break
				}
			}

			if recipientID != 0 {
				isBlockedRecipient, err := s.blockService.CheckBlock(ctx, senderID, recipientID)
				if err != nil {
					return nil, err
				}
				if isBlockedRecipient {
					return nil, ErrUserBlocked
				}
				isBlockedSender, err := s.blockService.CheckBlock(ctx, recipientID, senderID)
				if err != nil {
					return nil, err
				}
				if isBlockedSender {
					return nil, ErrUserBlocked
				}
			}
		}
	}

	isParticipant, err := s.chatRepo.IsUserInChat(ctx, senderID, chatID)
	if err != nil {
		return nil, err
	}

	if !isParticipant {
		return nil, ErrAccessDenied
	}

	if replyToMessageID != nil {
		replyMessage, err := s.messageRepo.GetMessageByID(ctx, *replyToMessageID)
		if err != nil {
			return nil, err
		}

		if replyMessage == nil || replyMessage.ChatID != chatID {
			return nil, ErrCannotReplyToMessage
		}
	}

	message := &model.Message{
		SenderID:         senderID,
		ChatID:           chatID,
		Content:          content,
		ReplyToMessageID: replyToMessageID,
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

	s.hub.Broadcast <- websocket.Event{
		Type:    "create_message",
		Payload: finalMessage,
	}

	return finalMessage, nil
}

func (s *messageService) ListMessagesInChat(ctx context.Context, userID, chatID, limit, offset int) (*dto.ListMessagesResponse, error) {
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

	chat, err := s.chatRepo.GetChatByID(ctx, chatID)
	if err != nil {
		return nil, err
	}
	if chat == nil {
		return nil, ErrChatNotFound
	}
	participantIDs, err := s.chatRepo.ListChatParticipantsID(ctx, chatID)
	if err != nil {
		return nil, err
	}

	var response dto.ListMessagesResponse
	response.Messages = messages

	if chat.Type == "private" {
		var recipientID int
		for _, id := range participantIDs {
			if id != userID {
				recipientID = id
				break
			}
		}

		isRecipientBlocked, err := s.blockService.CheckBlock(ctx, userID, recipientID)
		if err != nil {
			return nil, err
		}
		if isRecipientBlocked {
			response.BlockStatus = "recipient_blocked"
			return &response, nil
		}

		isSenderBlocked, err := s.blockService.CheckBlock(ctx, recipientID, userID)
		if err != nil {
			return nil, err
		}
		if isSenderBlocked {
			response.BlockStatus = "sender_blocked"
			return &response, nil
		}

		response.BlockStatus = "none"
		return &response, nil
	}

	response.BlockStatus = "none"
	return &response, nil
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

	s.hub.Broadcast <- websocket.Event{
		Type:    "update_message",
		Payload: message,
	}

	return message, nil
}

func (s *messageService) DeleteMessage(ctx context.Context, userID, messageID int) (*model.Message, error) {
	message, err := s.messageRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		return nil, err
	}
	if message == nil {
		return nil, ErrMessageNotFound
	}

	if userID != message.SenderID {
		return nil, ErrAccessDenied
	}

	if err = s.messageRepo.DeleteMessage(ctx, messageID); err != nil {
		return nil, err
	}

	deletePayload := &model.DeletedMessagePayload{
		ID:     messageID,
		ChatID: message.ChatID,
	}

	s.hub.Broadcast <- websocket.Event{
		Type:    "delete_message",
		Payload: deletePayload,
	}

	return message, nil
}

func (s *messageService) ForwardMessage(ctx context.Context, forwarderID, destinationChatID int, messageIDs []int) error {
	isParticipant, err := s.chatRepo.IsUserInChat(ctx, forwarderID, destinationChatID)
	if err != nil {
		return err
	}
	if !isParticipant {
		return ErrAccessDenied
	}

	for _, messageID := range messageIDs {
		message, err := s.messageRepo.GetMessageByID(ctx, messageID)
		if err != nil {
			return err
		}
		isParticipant, err = s.chatRepo.IsUserInChat(ctx, forwarderID, message.ChatID)
		if err != nil {
			return err
		}
		if !isParticipant {
			return ErrAccessDenied
		}

		forwardMessage := &model.Message{
			ChatID:              destinationChatID,
			SenderID:            forwarderID,
			ForwardedFromUserID: &message.SenderID,
			ForwardedFromChatID: &message.ChatID,
			Content:             message.Content,
			ReplyToMessageID:    nil,
		}

		_, err = s.messageRepo.CreateMessage(ctx, forwardMessage)
		if err != nil {
			return err
		}

		fullForwardedMessage, err := s.messageRepo.GetMessageByID(ctx, messageID)
		if err != nil {
			return err
		}

		s.hub.Broadcast <- websocket.Event{
			Type:    "create_message",
			Payload: fullForwardedMessage,
		}
	}

	return nil
}
