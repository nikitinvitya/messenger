package userrepository

import (
	"context"
	"database/sql"
	"errors"
	"github.com/nikitinvitya/messenger/internal/model"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *model.User) (int, error)
	GetUserByName(ctx context.Context, username string) (*model.User, error)
	GetUserByEmail(ctx context.Context, email string) (*model.User, error)
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{
		db: db,
	}
}

func (r *userRepository) CreateUser(ctx context.Context, user *model.User) (int, error) {
	sqlReq := `INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id`

	var insertedID int
	err := r.db.QueryRowContext(ctx, sqlReq, user.Email, user.Username, user.PasswordHash).Scan(&insertedID)
	if err != nil {
		return 0, err
	}

	return insertedID, nil
}

func (r *userRepository) GetUserByName(ctx context.Context, username string) (*model.User, error) {
	sqlReq := `SELECT id, email, username, password_hash FROM users WHERE username = $1`

	var user model.User
	sqlResponse := r.db.QueryRowContext(ctx, sqlReq, username)
	if err := sqlResponse.Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	sqlReq := `SELECT id, email, username, password_hash FROM users WHERE email = $1`

	var user model.User
	sqlResponse := r.db.QueryRowContext(ctx, sqlReq, email)
	if err := sqlResponse.Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &user, nil
}
