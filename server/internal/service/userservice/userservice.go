package userservice

import (
	"context"
	"errors"

	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
)

type UserService interface {
	GetProfile(ctx context.Context, id int) (*model.User, error)
	SearchUsersByUsername(ctx context.Context, userID int, username string) ([]model.User, error)
	UpdateProfile(ctx context.Context, userID int, username string, bio *string, avatarURL *string) (*model.User, error)
}

type userService struct {
	repo userrepository.UserRepository
}

func NewUserService(repo userrepository.UserRepository) UserService {
	return &userService{
		repo: repo,
	}
}

func (s *userService) GetProfile(ctx context.Context, id int) (*model.User, error) {
	return s.repo.GetUserByID(ctx, id)
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

	return s.repo.GetUserByID(ctx, userID)
}
