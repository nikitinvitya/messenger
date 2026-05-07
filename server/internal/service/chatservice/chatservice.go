package chatservice

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"time"

	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
	"github.com/nikitinvitya/messenger/internal/repository/messagerepository"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
	"github.com/nikitinvitya/messenger/internal/service/messageservice"
	"github.com/nikitinvitya/messenger/internal/websocket"
)

var (
	ErrInvalidParticipantsCount = errors.New("private chat must have exactly 2 participants")
	ErrInvalidChatType          = errors.New("unknown chat types")
	ErrInvalidChatName          = errors.New("invalid chat name")
)

type ChatService interface {
	CreateChat(ctx context.Context, participantIDs []int, typeChat string, chatName *string, creatorID int) (int, error)
	ListUserChats(ctx context.Context, userID int) ([]*dto.ChatResponse, error)
	IsUserInChat(ctx context.Context, userID int, chatID int) (bool, error)
	GetChatByID(ctx context.Context, userID int, chatID int) (*dto.ChatResponse, error)
	LeaveChat(ctx context.Context, userID int, chatID int) error
	UpdateChat(ctx context.Context, userID, chatID int, name *string, avatarURL *string) (*dto.ChatResponse, error)
	GetChatFullInfo(ctx context.Context, userID, chatID int) (*dto.ChatResponse, error)
	GetContactIDs(ctx context.Context, userID int) ([]int, error)
	AddParticipant(ctx context.Context, requesterID, chatID, targetUserID int) error
}

type chatService struct {
	repo        chatrepository.ChatRepository
	hub         *websocket.Hub
	messageRepo messagerepository.MessageRepository
	userRepo    userrepository.UserRepository
}

func NewChatService(repo chatrepository.ChatRepository, hub *websocket.Hub, messageRepo messagerepository.MessageRepository, userRepo userrepository.UserRepository) ChatService {
	return &chatService{
		repo:        repo,
		hub:         hub,
		messageRepo: messageRepo,
		userRepo:    userRepo,
	}
}

func (s *chatService) CreateChat(ctx context.Context, participantIDs []int, chatType string, chatName *string, creatorID int) (int, error) {
	allParticipants := make(map[int]struct{})

	allParticipants[creatorID] = struct{}{}

	for _, id := range participantIDs {
		allParticipants[id] = struct{}{}
	}

	finalUserIDs := make([]int, 0, len(allParticipants))
	for id := range allParticipants {
		finalUserIDs = append(finalUserIDs, id)
	}

	var chatID int
	var err error

	if chatType == "private" {
		if len(finalUserIDs) != 2 {
			return 0, ErrInvalidParticipantsCount
		}
		existingChatID, err := s.repo.FindPrivateChatByParticipants(ctx, finalUserIDs[0], finalUserIDs[1])

		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return 0, err
		}

		if err == nil {
			return existingChatID, nil
		}

		chatID, err = s.repo.CreateChat(ctx, nil, chatType, finalUserIDs)
	} else if chatType == "group" {
		if chatName == nil || *chatName == "" {
			return 0, ErrInvalidChatName
		}

		chatID, err = s.repo.CreateChat(ctx, chatName, chatType, finalUserIDs)
	} else {
		return 0, ErrInvalidChatType
	}

	if err != nil {
		return 0, err
	}

	fullChatData, err := s.GetChatByID(ctx, creatorID, chatID)
	if err == nil {
		s.hub.SendToUsers(websocket.EventChatCreated, fullChatData, finalUserIDs)
	}

	return chatID, nil
}

func (s *chatService) ListUserChats(ctx context.Context, userID int) ([]*dto.ChatResponse, error) {
	chats, err := s.repo.ListUserChats(ctx, userID)
	if err != nil {
		return nil, err
	}

	for _, chat := range chats {
		participants, err := s.repo.ListChatParticipants(ctx, chat.ID)
		if err != nil {
			return chats, err
		}

		for i := range participants {
			participants[i].IsOnline = s.hub.IsUserOnline(participants[i].ID)
		}

		chat.Participants = participants
	}

	return chats, nil
}

func (s *chatService) IsUserInChat(ctx context.Context, userID int, chatID int) (bool, error) {
	return s.repo.IsUserInChat(ctx, userID, chatID)
}

func (s *chatService) GetChatByID(ctx context.Context, userID int, chatID int) (*dto.ChatResponse, error) {
	isExist, err := s.repo.IsUserInChat(ctx, userID, chatID)
	if err != nil {
		return nil, err
	}
	if !isExist {
		return nil, messageservice.ErrAccessDenied
	}

	chat, err := s.repo.GetChatByID(ctx, chatID)
	if err != nil {
		return nil, err
	}

	participants, err := s.repo.ListChatParticipants(ctx, chatID)
	if err != nil {
		return nil, err
	}

	for i := range participants {
		participants[i].IsOnline = s.hub.IsUserOnline(participants[i].ID)
	}

	var result dto.ChatResponse
	result.ID = chat.ID
	result.Name = chat.Name
	result.Type = chat.Type
	result.CreatedAt = chat.CreatedAt
	result.Participants = participants
	result.AvatarURL = chat.AvatarURL

	return &result, nil
}

func (s *chatService) sendSystemMessage(ctx context.Context, chatID, userID int, text string, targets []int) {
	bgCtx := context.Background()

	user, err := s.userRepo.GetUserByID(bgCtx, userID)
	if err != nil {
		slog.Error("failed to get user for system message", "error", err)
		return
	}

	msg := &model.Message{
		ChatID:   chatID,
		SenderID: userID,
		Content:  text,
		Type:     "system",
	}

	msgID, err := s.messageRepo.CreateMessage(bgCtx, msg)
	if err != nil {
		slog.Error("failed to create system message", "error", err)
		return
	}

	payload := &dto.MessageResponse{
		ID:        msgID,
		ChatID:    chatID,
		Content:   text,
		CreatedAt: time.Now(),
		Type:      "system",
		Sender: &dto.SenderInfo{
			ID:        user.ID,
			Username:  user.Username,
			AvatarURL: user.AvatarURL,
		},
	}

	s.hub.SendToUsers(websocket.EventMessageCreated, payload, targets)
}

func (s *chatService) LeaveChat(ctx context.Context, userID int, chatID int) error {
	isParticipant, err := s.repo.IsUserInChat(ctx, userID, chatID)
	if err != nil {
		return err
	}
	if !isParticipant {
		return messageservice.ErrAccessDenied
	}

	participantIDs, err := s.repo.ListChatParticipantsID(ctx, chatID)
	if err != nil {
		return err
	}

	chat, err := s.repo.GetChatByID(ctx, chatID)
	if err != nil {
		return err
	}

	if chat.Type == "private" {
		if err := s.repo.DeleteChat(ctx, chatID); err != nil {
			return err
		}
		s.hub.SendToUsers(websocket.EventChatDeleted, map[string]int{"chatId": chatID}, participantIDs)
		return nil
	}

	if err = s.repo.LeaveChat(ctx, chatID, userID); err != nil {
		return err
	}

	leavePayload := &dto.UserLeftPayload{
		ChatID: chatID,
		UserID: userID,
	}
	s.hub.SendToUsers(websocket.EventUserLeftChat, leavePayload, participantIDs)

	updatedChatDTO, err := s.GetChatByID(context.Background(), userID, chatID)
	if err == nil {
		s.hub.SendToUsers(websocket.EventChatUpdated, updatedChatDTO, participantIDs)
	}

	go s.sendSystemMessage(context.Background(), chatID, userID, "left the chat", participantIDs)

	participantsCount, err := s.repo.CountChatParticipants(ctx, chatID)
	if err != nil {
		slog.Error("failed to count participants after leaving chat", "error", err, "chatID", chatID)
	}
	if participantsCount == 0 {
		err = s.repo.DeleteChat(ctx, chatID)
		if err != nil {
			slog.Error("failed to delete chat", "error", err, "chatID", chatID)
		}
	}

	return nil
}

func (s *chatService) UpdateChat(ctx context.Context, userID, chatID int, name *string, avatarURL *string) (*dto.ChatResponse, error) {
	isMember, err := s.repo.IsUserInChat(ctx, userID, chatID)
	if err != nil || !isMember {
		return nil, errors.New("access denied")
	}

	chat, err := s.repo.GetChatByID(ctx, chatID)
	if err != nil {
		return nil, err
	}
	if chat.Type != "group" {
		return nil, errors.New("cannot update private chat info")
	}

	var systemText string
	if name != nil && (chat.Name == nil || *name != *chat.Name) {
		systemText = "changed the group name to " + *name
	} else if avatarURL != nil && (chat.AvatarURL == nil || *avatarURL != *chat.AvatarURL) {
		systemText = "updated the group photo"
	}

	if err := s.repo.UpdateChat(ctx, chatID, name, avatarURL); err != nil {
		return nil, err
	}

	updatedChatDTO, err := s.GetChatByID(ctx, userID, chatID)
	if err != nil {
		return nil, err
	}

	participantIDs, _ := s.repo.ListChatParticipantsID(ctx, chatID)
	s.hub.SendToUsers(websocket.EventChatUpdated, updatedChatDTO, participantIDs)

	if systemText != "" {
		go s.sendSystemMessage(context.Background(), chatID, userID, systemText, participantIDs)
	}

	return updatedChatDTO, nil
}
func (s *chatService) GetChatFullInfo(ctx context.Context, userID, chatID int) (*dto.ChatResponse, error) {
	return s.GetChatByID(ctx, userID, chatID)
}

func (s *chatService) GetContactIDs(ctx context.Context, userID int) ([]int, error) {
	return s.repo.GetContactIDs(ctx, userID)
}

func (s *chatService) AddParticipant(ctx context.Context, requesterID, chatID, targetUserID int) error {
	chat, err := s.repo.GetChatByID(ctx, chatID)
	if err != nil {
		return err
	}
	if chat == nil {
		return errors.New("chat not found")
	}

	if chat.Type != "group" {
		return errors.New("cannot add participants to a private chat")
	}

	isRequesterInChat, err := s.repo.IsUserInChat(ctx, requesterID, chatID)
	if err != nil {
		return err
	}
	if !isRequesterInChat {
		return errors.New("access denied: you are not a participant of this group")
	}

	isTargetInChat, err := s.repo.IsUserInChat(ctx, targetUserID, chatID)
	if err != nil {
		return err
	}
	if isTargetInChat {
		return errors.New("user is already a member of this group")
	}

	if err := s.repo.AddParticipant(ctx, chatID, targetUserID); err != nil {
		return err
	}

	updatedChat, _ := s.GetChatByID(ctx, requesterID, chatID)
	participantIDs, _ := s.repo.ListChatParticipantsID(ctx, chatID)

	s.hub.SendToUsers(websocket.EventChatUpdated, updatedChat, participantIDs)
	s.hub.SendToUsers(websocket.EventChatCreated, updatedChat, []int{targetUserID})

	go s.sendSystemMessage(context.Background(), chatID, targetUserID, "joined the chat", participantIDs)

	return nil
}
