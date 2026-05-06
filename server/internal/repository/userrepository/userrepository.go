package userrepository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/nikitinvitya/messenger/internal/model"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *model.User) (int, error)
	GetUserByName(ctx context.Context, username string) (*model.User, error)
	GetUserByEmail(ctx context.Context, email string) (*model.User, error)
	GetUserByID(ctx context.Context, id int) (*model.User, error)
	FindUsersByUsername(ctx context.Context, userID int, username string) ([]model.User, error)
	UpdateUserProfile(ctx context.Context, user *model.User) error
	CreateVerificationToken(ctx context.Context, userID int, token string, expiresAt time.Time) error
	GetUserByVerificationToken(ctx context.Context, token string) (int, error)
	MarkUserAsVerified(ctx context.Context, userID int) error
	DeleteVerificationToken(ctx context.Context, token string) error
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
	sqlReq := `SELECT id, email, username, password_hash, bio, avatar_url, is_verified FROM users WHERE username = $1`

	var user model.User
	sqlResponse := r.db.QueryRowContext(ctx, sqlReq, username)
	if err := sqlResponse.Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.Bio, &user.AvatarURL, &user.IsVerified); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	sqlReq := `SELECT id, email, username, password_hash, bio, avatar_url, is_verified FROM users WHERE email = $1`

	var user model.User
	sqlResponse := r.db.QueryRowContext(ctx, sqlReq, email)
	if err := sqlResponse.Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash, &user.Bio, &user.AvatarURL, &user.IsVerified); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetUserByID(ctx context.Context, id int) (*model.User, error) {
	sqlReq := `SELECT id, email, username, created_at, bio, avatar_url, is_verified FROM users WHERE id = $1`

	var user model.User
	sqlResponse := r.db.QueryRowContext(ctx, sqlReq, id)
	if err := sqlResponse.Scan(&user.ID, &user.Email, &user.Username, &user.CreatedAt, &user.Bio, &user.AvatarURL, &user.IsVerified); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &user, nil
}

func (r *userRepository) FindUsersByUsername(ctx context.Context, userID int, username string) ([]model.User, error) {
	sqlReq := `SELECT id, username, avatar_url, bio, is_verified from users WHERE id != $1 AND username ilike $2 LIMIT 10`
	searchUsername := "%" + username + "%"

	users, err := r.db.QueryContext(ctx, sqlReq, userID, searchUsername)
	if err != nil {
		return nil, err
	}
	defer users.Close()

	result := make([]model.User, 0)
	for users.Next() {
		var user model.User

		if err = users.Scan(&user.ID, &user.Username, &user.AvatarURL, &user.Bio, &user.IsVerified); err != nil {
			return result, err
		}

		result = append(result, user)
	}

	if err = users.Err(); err != nil {
		return result, err
	}

	return result, nil

}

func (r *userRepository) UpdateUserProfile(ctx context.Context, user *model.User) error {
	sqlReq := `UPDATE users 
			   SET bio = $1, avatar_url = $2, username = $3
			   WHERE id = $4`

	result, err := r.db.ExecContext(ctx, sqlReq, user.Bio, user.AvatarURL, user.Username, user.ID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *userRepository) CreateVerificationToken(ctx context.Context, userID int, token string, expiresAt time.Time) error {
	query := `INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`
	_, err := r.db.ExecContext(ctx, query, userID, token, expiresAt)
	return err
}

func (r *userRepository) GetUserByVerificationToken(ctx context.Context, token string) (int, error) {
	query := `SELECT user_id FROM verification_tokens WHERE token = $1 AND expires_at > NOW()`
	var userID int
	err := r.db.QueryRowContext(ctx, query, token).Scan(&userID)
	return userID, err
}

func (r *userRepository) MarkUserAsVerified(ctx context.Context, userID int) error {
	query := `UPDATE users SET is_verified = TRUE WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

func (r *userRepository) DeleteVerificationToken(ctx context.Context, token string) error {
	query := `DELETE FROM verification_tokens WHERE token = $1`
	_, err := r.db.ExecContext(ctx, query, token)
	return err
}
