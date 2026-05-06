package authservice

import (
	"context"
	"errors"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
	"github.com/nikitinvitya/messenger/pkg/email"
	"golang.org/x/crypto/bcrypt"
)

const (
	WS_KEY   = "ws_ticket"
	HTTP_KEY = "http_session"
)

type AuthService interface {
	Register(ctx context.Context, email, username, password string) error
	Login(ctx context.Context, identifier, password string) (string, time.Time, error)
	GenerateWSTicket(ctx context.Context, userID int) (string, error)
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, emailStr string) error
}

var (
	UsernameAlreadyExists = errors.New("this username already exist")
	EmailAlreadyExists    = errors.New("this email already exist")
	InvalidCredentials    = errors.New("invalid credentials")
	EmailNotVerified      = errors.New("email not verified")
	ExpirationTime        = time.Hour * 24
)

type authService struct {
	repos     userrepository.UserRepository
	jwtSecret string
	mailer    email.Mailer
}

func NewAuthService(repos userrepository.UserRepository, jwtSecret string, mailer email.Mailer) AuthService {
	return &authService{
		repos:     repos,
		jwtSecret: jwtSecret,
		mailer:    mailer,
	}
}

func (s *authService) Register(ctx context.Context, emailStr, username, password string) error {
	user, err := s.repos.GetUserByName(ctx, username)
	if err != nil {
		return err
	}
	if user != nil {
		return UsernameAlreadyExists
	}

	user, err = s.repos.GetUserByEmail(ctx, emailStr)
	if err != nil {
		return err
	}
	if user != nil {
		return EmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	newUser := &model.User{
		Email:        emailStr,
		Username:     username,
		PasswordHash: string(hashedPassword),
	}

	userID, err := s.repos.CreateUser(ctx, newUser)
	if err != nil {
		return err
	}

	token := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	if err := s.repos.CreateVerificationToken(ctx, userID, token, expiresAt); err != nil {
		return err
	}

	go func() {
		if err := s.mailer.SendVerificationEmail(emailStr, token); err != nil {
			slog.Error("failed to send verification email", "error", err, "email", emailStr)
		}
	}()

	return nil
}

func (s *authService) Login(ctx context.Context, identifier, password string) (string, time.Time, error) {
	var user *model.User
	var err error

	if strings.Contains(identifier, "@") {
		user, err = s.repos.GetUserByEmail(ctx, identifier)
	} else {
		user, err = s.repos.GetUserByName(ctx, identifier)
	}

	if err != nil {
		return "", time.Time{}, err
	}

	if user == nil {
		return "", time.Time{}, InvalidCredentials
	}

	if !user.IsVerified {
		return "", time.Time{}, EmailNotVerified
	}

	if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", time.Time{}, InvalidCredentials
	}

	expirationTime := time.Now().Add(ExpirationTime)
	claims := &jwt.RegisteredClaims{
		Subject:   strconv.Itoa(user.ID),
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		Audience:  jwt.ClaimStrings{HTTP_KEY},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

func (s *authService) VerifyEmail(ctx context.Context, token string) error {
	userID, err := s.repos.GetUserByVerificationToken(ctx, token)
	if err != nil {
		return errors.New("invalid or expired token")
	}

	if err := s.repos.MarkUserAsVerified(ctx, userID); err != nil {
		return err
	}

	return s.repos.DeleteVerificationToken(ctx, token)
}

func (s *authService) ResendVerification(ctx context.Context, emailStr string) error {
	user, err := s.repos.GetUserByEmail(ctx, emailStr)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	if user.IsVerified {
		return errors.New("email already verified")
	}

	_ = s.repos.DeleteVerificationToken(ctx, emailStr)

	token := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	if err := s.repos.CreateVerificationToken(ctx, user.ID, token, expiresAt); err != nil {
		return err
	}

	go func() {
		_ = s.mailer.SendVerificationEmail(user.Email, token)
	}()

	return nil
}

func (s *authService) GenerateWSTicket(_ context.Context, userID int) (string, error) {
	expirationTime := time.Now().Add(60 * time.Second)
	claims := &jwt.RegisteredClaims{
		Subject:   strconv.Itoa(userID),
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		Audience:  jwt.ClaimStrings{WS_KEY},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
