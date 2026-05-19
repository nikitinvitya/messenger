package messageservice

import (
	"context"
	"errors"
	"log/slog"

	"github.com/nikitinvitya/messenger/internal/cache"
	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
	"github.com/nikitinvitya/messenger/internal/repository/messagerepository"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
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
	CreateMessage(ctx context.Context, senderID, chatID int, content string, replyToMessageID *int, imageURL *string) (*model.Message, error)
	ListMessagesInChat(ctx context.Context, userID, chatID, limit, offset int) (*dto.ListMessagesResponse, error)
	UpdateMessage(ctx context.Context, userID, messageID int, newContent string) (*model.Message, error)
	DeleteMessage(ctx context.Context, userID, messageID int) (*model.Message, error)
	ForwardMessage(ctx context.Context, forwarderID, destinationChatID int, messageIDs []int) error
}

type messageService struct {
	chatRepo     chatrepository.ChatRepository
	messageRepo  messagerepository.MessageRepository
	userRepo     userrepository.UserRepository
	hub          *websocket.Hub
	blockService blocklistservice.BlocklistService
	cache        cache.Cache
}

func NewMessageService(chatRepo chatrepository.ChatRepository, messageRepo messagerepository.MessageRepository, userRepo userrepository.UserRepository, hub *websocket.Hub, blockService blocklistservice.BlocklistService, c cache.Cache) MessageService {
	return &messageService{
		chatRepo:     chatRepo,
		messageRepo:  messageRepo,
		userRepo:     userRepo,
		hub:          hub,
		blockService: blockService,
		cache:        c,
	}
}

func (s *messageService) invalidateChatCaches(ctx context.Context, chatID int) {
	participantIDs, err := s.chatRepo.ListChatParticipantsID(ctx, chatID)
	if err != nil {
		slog.Warn("cache: list participants for invalidation", "error", err, "chatID", chatID)
		return
	}
	if err := s.cache.InvalidateUserChats(ctx, participantIDs...); err != nil {
		slog.Warn("cache: invalidate user chats", "error", err)
	}
	if err := s.cache.InvalidateChat(ctx, chatID, participantIDs); err != nil {
		slog.Warn("cache: invalidate chat", "error", err, "chatID", chatID)
	}
}

func (s *messageService) CreateMessage(ctx context.Context, senderID, chatID int, content string, replyToMessageID *int, imageURL *string) (*model.Message, error) {
	chat, err := s.chatRepo.GetChatByID(ctx, chatID)
	if err != nil {
		return nil, err
	}

	if chat == nil {
		return nil, ErrChatNotFound
	}

	if content == "" && (imageURL == nil || *imageURL == "") {
		return nil, errors.New("message content or image is required")
	}

	if chat.Type == model.ChatTypePrivate {
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

	msgType := "text"
	if imageURL != nil && *imageURL != "" {
		msgType = "image"
	}

	message := &model.Message{
		SenderID:         senderID,
		ChatID:           chatID,
		Content:          content,
		ReplyToMessageID: replyToMessageID,
		ImageURL:         imageURL,
		Type:             msgType,
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

	sender, err := s.userRepo.GetUserByID(ctx, finalMessage.SenderID)
	if err != nil {
		slog.Error("failed to get sender info for websocket broadcast", "error", err, "message_id", finalMessage.ID)
	}

	messagePayload := &dto.MessageResponse{
		ID:                  finalMessage.ID,
		ChatID:              finalMessage.ChatID,
		Content:             finalMessage.Content,
		CreatedAt:           finalMessage.CreatedAt,
		EditedAt:            finalMessage.EditedAt,
		ReplyToMessageID:    finalMessage.ReplyToMessageID,
		ForwardedFromUserID: finalMessage.ForwardedFromUserID,
		ForwardedFromChatID: finalMessage.ForwardedFromChatID,
		ImageURL:            finalMessage.ImageURL,
		Type:                finalMessage.Type,
	}
	if sender != nil {
		messagePayload.Sender = &dto.SenderInfo{
			ID:        sender.ID,
			Username:  sender.Username,
			AvatarURL: sender.AvatarURL,
		}
	}

	participantsIDs, err := s.chatRepo.ListChatParticipantsID(ctx, chatID)
	if err != nil {
		slog.Error("failed to get participants for broadcast", "error", err, "chatID", chatID)
	}

	s.hub.SendToUsers(websocket.EventMessageCreated, messagePayload, participantsIDs)
	s.invalidateChatCaches(ctx, chatID)
	s.broadcastChatListUpdate(ctx, chatID, participantsIDs)

	return finalMessage, nil
}

func (s *messageService) broadcastChatListUpdate(ctx context.Context, chatID int, participantIDs []int) {
	participants, err := s.chatRepo.ListChatParticipants(ctx, chatID)
	if err != nil {
		slog.Warn("failed to list participants for chat list broadcast", "error", err, "chatID", chatID)
		return
	}

	for _, userID := range participantIDs {
		chatItem, err := s.chatRepo.GetUserChatListItem(ctx, userID, chatID)
		if err != nil {
			slog.Warn("failed to get chat list item for broadcast", "error", err, "userID", userID, "chatID", chatID)
			continue
		}
		if chatItem == nil {
			continue
		}

		chatItem.Participants = participants
		cache.RefreshChatOnline(chatItem, s.hub)
		s.hub.SendToUsers(websocket.EventChatUpdated, chatItem, []int{userID})
	}
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

	if chat.Type == model.ChatTypePrivate {
		var recipientID int
		for _, id := range participantIDs {
			if id != userID {
				recipientID = id
				break
			}
		}

		if recipientID == 0 {
			response.BlockStatus = "none"
			return &response, nil
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

	updatedMessage, err := s.messageRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		return nil, err
	}

	sender, err := s.userRepo.GetUserByID(ctx, updatedMessage.SenderID)
	if err != nil {
		slog.Error("failed to get sender info for websocket broadcast", "error", err, "message_id", updatedMessage.ID)
	}

	messagePayload := &dto.MessageResponse{
		ID:                  updatedMessage.ID,
		ChatID:              updatedMessage.ChatID,
		Content:             updatedMessage.Content,
		CreatedAt:           updatedMessage.CreatedAt,
		EditedAt:            updatedMessage.EditedAt,
		ReplyToMessageID:    updatedMessage.ReplyToMessageID,
		ForwardedFromUserID: updatedMessage.ForwardedFromUserID,
		ForwardedFromChatID: updatedMessage.ForwardedFromChatID,
		ImageURL:            updatedMessage.ImageURL,
		Type:                updatedMessage.Type,
	}
	if sender != nil {
		messagePayload.Sender = &dto.SenderInfo{
			ID:        sender.ID,
			Username:  sender.Username,
			AvatarURL: sender.AvatarURL,
		}
	}

	participantsIDs, err := s.chatRepo.ListChatParticipantsID(ctx, updatedMessage.ChatID)
	if err != nil {
		slog.Error("failed to get participants for broadcast", "error", err, "chatID", updatedMessage.ChatID)
	}

	s.hub.SendToUsers(websocket.EventMessageUpdated, messagePayload, participantsIDs)
	s.invalidateChatCaches(ctx, updatedMessage.ChatID)

	return updatedMessage, nil
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

	participantsIDs, err := s.chatRepo.ListChatParticipantsID(ctx, message.ChatID)
	if err != nil {
		slog.Error("failed to get participants for broadcast", "error", err, "chatID", message.ChatID)
	}

	s.hub.SendToUsers(websocket.EventMessageDeleted, deletePayload, participantsIDs)
	s.invalidateChatCaches(ctx, message.ChatID)

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

	participantsIDs, err := s.chatRepo.ListChatParticipantsID(ctx, destinationChatID)
	if err != nil {
		slog.Error("failed to get participants for broadcast", "error", err, "chatID", destinationChatID)
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
			ImageURL:            message.ImageURL,
			Type:                message.Type,
			ReplyToMessageID:    nil,
		}

		forwardedMessageID, err := s.messageRepo.CreateMessage(ctx, forwardMessage)
		if err != nil {
			return err
		}

		finalMessage, err := s.messageRepo.GetMessageByID(ctx, forwardedMessageID)
		if err != nil {
			return err
		}

		sender, _ := s.userRepo.GetUserByID(ctx, forwarderID)
		messagePayload := &dto.MessageResponse{
			ID:                  finalMessage.ID,
			ChatID:              finalMessage.ChatID,
			Content:             finalMessage.Content,
			CreatedAt:           finalMessage.CreatedAt,
			ForwardedFromUserID: finalMessage.ForwardedFromUserID,
			ForwardedFromChatID: finalMessage.ForwardedFromChatID,
			ImageURL:            finalMessage.ImageURL,
			Type:                message.Type,
		}
		if sender != nil {
			messagePayload.Sender = &dto.SenderInfo{
				ID:        sender.ID,
				Username:  sender.Username,
				AvatarURL: sender.AvatarURL,
			}
		}

		s.hub.SendToUsers(websocket.EventMessageCreated, messagePayload, participantsIDs)
	}

	s.invalidateChatCaches(ctx, destinationChatID)

	return nil
}
