package userservice

import (
	"context"
	"database/sql"
	"errors"

	"log/slog"

	"github.com/nikitinvitya/messenger/internal/cache"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
	"github.com/nikitinvitya/messenger/internal/websocket"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound           = errors.New("user not found")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
)

type UserService interface {
	GetProfileByID(ctx context.Context, id int) (*model.User, error)
	GetProfileByName(ctx context.Context, username string) (*model.User, error)
	SearchUsersByUsername(ctx context.Context, userID int, username string) ([]model.User, error)
	UpdateProfile(ctx context.Context, userID int, username string, bio *string, avatarURL *string) (*model.User, error)
	ChangePassword(ctx context.Context, userID int, currentPassword, newPassword string) error
}

type userService struct {
	repo     userrepository.UserRepository
	chatRepo chatrepository.ChatRepository
	hub      *websocket.Hub
	cache    cache.Cache
}

func NewUserService(repo userrepository.UserRepository, chatRepo chatrepository.ChatRepository, hub *websocket.Hub, c cache.Cache) UserService {
	return &userService{
		repo:     repo,
		chatRepo: chatRepo,
		hub:      hub,
		cache:    c,
	}
}

func (s *userService) GetProfileByID(ctx context.Context, id int) (*model.User, error) {
	key := cache.UserByIDKey(id)
	var cached model.User
	if ok, err := s.cache.Get(ctx, key, &cached); err == nil && ok {
		cache.RefreshUserOnline(&cached, s.hub)
		return &cached, nil
	}

	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	user.IsOnline = s.hub.IsUserOnline(user.ID)

	if err := s.cache.Set(ctx, key, user, 0); err != nil {
		slog.Warn("cache: set user by id", "error", err, "userID", id)
	}

	return user, nil
}

func (s *userService) GetProfileByName(ctx context.Context, username string) (*model.User, error) {
	key := cache.UserByUsernameKey(username)
	var cached model.User
	if ok, err := s.cache.Get(ctx, key, &cached); err == nil && ok {
		cache.RefreshUserOnline(&cached, s.hub)
		return &cached, nil
	}

	user, err := s.repo.GetUserByName(ctx, username)
	if err != nil {
		return nil, err
	}
	user.IsOnline = s.hub.IsUserOnline(user.ID)

	if err := s.cache.Set(ctx, key, user, 0); err != nil {
		slog.Warn("cache: set user by username", "error", err, "username", username)
	}
	if err := s.cache.Set(ctx, cache.UserByIDKey(user.ID), user, 0); err != nil {
		slog.Warn("cache: set user by id", "error", err, "userID", user.ID)
	}

	return user, nil
}

func (s *userService) SearchUsersByUsername(ctx context.Context, userID int, username string) ([]model.User, error) {
	users, err := s.repo.FindUsersByUsername(ctx, userID, username)
	if err != nil {
		return nil, err
	}
	
	for i := range users {
		users[i].IsOnline = s.hub.IsUserOnline(users[i].ID)
	}

	return users, nil
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

	s.invalidateUserProfileCache(ctx, userID, currentUser.Username, username)

	return s.GetProfileByID(ctx, userID)
}

func (s *userService) invalidateUserProfileCache(ctx context.Context, userID int, oldUsername, newUsername string) {
	if err := s.cache.InvalidateUser(ctx, userID, oldUsername); err != nil {
		slog.Warn("cache: invalidate user", "error", err)
	}
	if newUsername != oldUsername {
		if err := s.cache.InvalidateUser(ctx, userID, newUsername); err != nil {
			slog.Warn("cache: invalidate user", "error", err)
		}
	}

	ids := []int{userID}
	if contactIDs, err := s.chatRepo.GetContactIDs(ctx, userID); err == nil {
		ids = append(ids, contactIDs...)
	}
	if err := s.cache.InvalidateUserChats(ctx, ids...); err != nil {
		slog.Warn("cache: invalidate contact chats", "error", err)
	}
}

func (s *userService) ChangePassword(ctx context.Context, userID int, currentPassword, newPassword string) error {
	passwordHash, err := s.repo.GetPasswordHashByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrUserNotFound
		}
		return err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(currentPassword)); err != nil {
		return ErrInvalidCurrentPassword
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err = s.repo.UpdatePassword(ctx, userID, string(newHash)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrUserNotFound
		}
		return err
	}

	return nil
}
