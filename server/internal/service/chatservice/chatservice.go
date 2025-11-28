package chatservice

import (
	"context"
	"database/sql"
	"errors"
	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
	"github.com/nikitinvitya/messenger/internal/service/messageservice"
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
}

type chatService struct {
	repo chatrepository.ChatRepository
}

func NewChatService(repo chatrepository.ChatRepository) ChatService {
	return &chatService{
		repo: repo,
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

		return s.repo.CreateChat(ctx, nil, chatType, finalUserIDs)
	} else if chatType == "group" {
		if chatName == nil || *chatName == "" {
			return 0, ErrInvalidChatName
		}

		return s.repo.CreateChat(ctx, chatName, chatType, finalUserIDs)
	}

	return 0, ErrInvalidChatType
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

	return &result, nil
}
