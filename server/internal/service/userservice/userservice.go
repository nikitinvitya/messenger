package userservice

import (
	"context"
	"errors"

	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
	"github.com/nikitinvitya/messenger/internal/websocket"
)

type UserService interface {
	GetProfileByID(ctx context.Context, id int) (*model.User, error)
	GetProfileByName(ctx context.Context, username string) (*model.User, error)
	SearchUsersByUsername(ctx context.Context, userID int, username string) ([]model.User, error)
	UpdateProfile(ctx context.Context, userID int, username string, bio *string, avatarURL *string) (*model.User, error)
}

type userService struct {
	repo userrepository.UserRepository
	hub  *websocket.Hub
}

func NewUserService(repo userrepository.UserRepository, hub *websocket.Hub) UserService {
	return &userService{
		repo: repo,
		hub:  hub,
	}
}

func (s *userService) GetProfileByID(ctx context.Context, id int) (*model.User, error) {
	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	user.IsOnline = s.hub.IsUserOnline(user.ID)
	return user, nil
}

func (s *userService) GetProfileByName(ctx context.Context, username string) (*model.User, error) {
	user, err := s.repo.GetUserByName(ctx, username)
	if err != nil {
		return nil, err
	}
	user.IsOnline = s.hub.IsUserOnline(user.ID)
	return user, nil
}

func (s *userService) SearchUsersByUsername(ctx context.Context, userID int, username string) ([]model.User, error) {
	return s.repo.FindUsersByUsername(ctx, userID, username)
}

func (s *userService) UpdateProfile(ctx context.Context, userID int, username string, bio *string, avatarURL *string) (*model.User, error) {
	currentUser, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if username != currentUser.Username {
		existing, _ := s.repo.GetUserByName(ctx, username)
		if existing != nil {
			return nil, errors.New("username already taken")
		}
	}

	updatedUser := &model.User{
		ID:        userID,
		Username:  username,
		Bio:       bio,
		AvatarURL: avatarURL,
	}

	if err := s.repo.UpdateUserProfile(ctx, updatedUser); err != nil {
		return nil, err
	}

	return s.GetProfileByID(ctx, userID)
}
