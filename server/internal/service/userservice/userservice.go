package userservice

import (
	"context"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
)

type UserService interface {
	GetProfile(ctx context.Context, id int) (*model.User, error)
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
