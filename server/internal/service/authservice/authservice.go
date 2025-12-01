package authservice

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
	"golang.org/x/crypto/bcrypt"
	"strconv"
	"strings"
	"time"
)

const (
	WS_KEY   = "ws_ticket"
	HTTP_KEY = "http_session"
)

type AuthService interface {
	Register(ctx context.Context, email, username, password string) error
	Login(ctx context.Context, identifier, password string) (string, time.Time, error)
	GenerateWSTicket(ctx context.Context, userID int) (string, error)
}

var (
	UsernameAlreadyExists = errors.New("this username already exist")
	EmailAlreadyExists    = errors.New("this email already exist")
	InvalidCredentials    = errors.New("invalid credentials")
	ExpirationTime        = time.Hour * 24
)

type authService struct {
	repos     userrepository.UserRepository
	jwtSecret string
}

func NewAuthService(repos userrepository.UserRepository, jwtSecret string) AuthService {
	return &authService{
		repos:     repos,
		jwtSecret: jwtSecret,
	}
}

func (s *authService) Register(ctx context.Context, email, username, password string) error {
	user, err := s.repos.GetUserByName(ctx, username)
	if err != nil {
		return err
	}
	if user != nil {
		return UsernameAlreadyExists
	}

	user, err = s.repos.GetUserByEmail(ctx, email)
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

	user = &model.User{
		Email:        email,
		Username:     username,
		PasswordHash: string(hashedPassword),
	}

	_, err = s.repos.CreateUser(ctx, user)
	if err != nil {
		return err
	}

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

func (s *authService) GenerateWSTicket(_ context.Context, userID int) (string, error) {
	expirationTime := time.Now().Add(30 * time.Second)
	claims := &jwt.RegisteredClaims{
		Subject:   strconv.Itoa(userID),
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		Audience:  jwt.ClaimStrings{WS_KEY},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
