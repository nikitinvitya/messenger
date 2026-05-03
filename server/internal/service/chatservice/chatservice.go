package chatservice

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"

	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
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
}

type chatService struct {
	repo chatrepository.ChatRepository
	hub  *websocket.Hub
}

func NewChatService(repo chatrepository.ChatRepository, hub *websocket.Hub) ChatService {
	return &chatService{
		repo: repo,
		hub:  hub,
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

	var result dto.ChatResponse
	chat, err := s.repo.GetChatByID(ctx, chatID)
	if err != nil {
		return nil, err
	}

	participants, err := s.repo.ListChatParticipants(ctx, chatID)
	if err != nil {
		return nil, err
	}

	result.ID = chat.ID
	result.Name = chat.Name
	result.Type = chat.Type
	result.CreatedAt = chat.CreatedAt
	result.Participants = participants
	result.AvatarURL = chat.AvatarURL

	return &result, nil
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

		s.hub.SendToUsers(websocket.EventChatDeleted, map[string]int{"chatID": chatID}, participantIDs)
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

	if err := s.repo.UpdateChat(ctx, chatID, name, avatarURL); err != nil {
		return nil, err
	}

	updatedChatDTO, err := s.GetChatByID(ctx, userID, chatID)
	if err != nil {
		return nil, err
	}

	participantIDs, _ := s.repo.ListChatParticipantsID(ctx, chatID)
	s.hub.SendToUsers(websocket.EventChatUpdated, updatedChatDTO, participantIDs)

	return updatedChatDTO, nil
}

func (s *chatService) GetChatFullInfo(ctx context.Context, userID, chatID int) (*dto.ChatResponse, error) {
	isMember, err := s.repo.IsUserInChat(ctx, userID, chatID)
	if err != nil || !isMember {
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

	return &dto.ChatResponse{
		ID:           chat.ID,
		Name:         chat.Name,
		Type:         chat.Type,
		AvatarURL:    chat.AvatarURL,
		CreatedAt:    chat.CreatedAt,
		Participants: participants,
	}, nil
}
