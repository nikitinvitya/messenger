package chatservice

import (
	"context"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
)

type ChatService interface {
	CreateChat(ctx context.Context, participantIDs []int, creatorID int) (int, error)
	ListUserChats(ctx context.Context, userID int) ([]model.Chat, error)
}

type chatService struct {
	repo chatrepository.ChatRepository
}

func NewChatService(repo chatrepository.ChatRepository) ChatService {
	return &chatService{
		repo: repo,
	}
}

func (s *chatService) CreateChat(ctx context.Context, participantIDs []int, creatorID int) (int, error) {
	allParticipants := make(map[int]struct{})

	allParticipants[creatorID] = struct{}{}

	for _, id := range participantIDs {
		allParticipants[id] = struct{}{}
	}

	finalUserIDs := make([]int, 0, len(allParticipants))
	for id := range allParticipants {
		finalUserIDs = append(finalUserIDs, id)
	}

	chatID, err := s.repo.CreateChat(ctx, nil, finalUserIDs)
	if err != nil {
		return 0, err
	}

	return chatID, nil
}

func (s *chatService) ListUserChats(ctx context.Context, userID int) ([]model.Chat, error) {
	chats, err := s.repo.ListUserChats(ctx, userID)
	if err != nil {
		return nil, err
	}

	return chats, nil
}
