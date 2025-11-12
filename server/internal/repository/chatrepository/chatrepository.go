package chatrepository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"github.com/nikitinvitya/messenger/internal/model"
)

type ChatRepository interface {
	CreateChat(ctx context.Context, name *string, chatType string, userIDs []int) (int, error)
	ListUserChats(ctx context.Context, userID int) ([]model.Chat, error)
	IsUserInChat(ctx context.Context, userID int, chatID int) (bool, error)
	FindPrivateChatByParticipants(ctx context.Context, userID1 int, userID2 int) (int, error)
	GetChatByID(ctx context.Context, chatID int) (*model.Chat, error)
	ListChatParticipantsID(ctx context.Context, chatID int) ([]int, error)
}

type chatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) ChatRepository {
	return &chatRepository{
		db: db,
	}
}

func (r *chatRepository) CreateChat(ctx context.Context, name *string, chatType string, userIDs []int) (int, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	sqlReqCreateChat := `INSERT INTO chats (name, type) VALUES ($1, $2) RETURNING id`
	var chatID int
	if err = tx.QueryRowContext(ctx, sqlReqCreateChat, name, chatType).Scan(&chatID); err != nil {
		return 0, fmt.Errorf("failed to create chat: %w", err)
	}

	sqlReqInsertParticipants := `INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)`
	stmt, err := tx.PrepareContext(ctx, sqlReqInsertParticipants)
	if err != nil {
		return 0, fmt.Errorf("failed to prepare statement for participants: %w", err)
	}
	defer stmt.Close()

	for _, userID := range userIDs {
		if _, err = stmt.ExecContext(ctx, chatID, userID); err != nil {
			return 0, fmt.Errorf("failed to add participant %d to chat %d: %w", userID, chatID, err)
		}
	}

	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return chatID, nil
}

func (r *chatRepository) ListUserChats(ctx context.Context, userID int) ([]model.Chat, error) {
	sqlReq := `SELECT c.id, c.name, c.created_at
			   FROM chats C
			   JOIN chat_participants CP ON CP.chat_id = c.id
			   WHERE cp.user_id = $1
			   ORDER BY c.created_at DESC`

	rows, err := r.db.QueryContext(ctx, sqlReq, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chats []model.Chat
	for rows.Next() {
		var chat model.Chat

		if err = rows.Scan(&chat.ID, &chat.Name, &chat.CreatedAt); err != nil {
			return chats, err
		}

		chats = append(chats, chat)
	}

	if err = rows.Err(); err != nil {
		return chats, err
	}

	return chats, nil
}

func (r *chatRepository) IsUserInChat(ctx context.Context, userID int, chatID int) (bool, error) {
	sqlReq := `SELECT EXISTS (
						SELECT 1
						FROM chat_participants
						WHERE user_id = $1 AND chat_id = $2)`

	var exists bool

	if err := r.db.QueryRowContext(ctx, sqlReq, userID, chatID).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to checkout participants: %w", err)
	}

	return exists, nil

}

func (r *chatRepository) FindPrivateChatByParticipants(ctx context.Context, userID1 int, userID2 int) (int, error) {
	sqlReq := `	SELECT cp.chat_id
			   	FROM chat_participants cp
			   	JOIN chats c ON cp.chat_id = c.id
			   	WHERE cp.user_id IN ($1, $2) AND c.type = 'private'
			   	GROUP BY cp.chat_id
			   	HAVING COUNT(DISTINCT cp.user_id) = 2`

	var chatID int
	if err := r.db.QueryRowContext(ctx, sqlReq, userID1, userID2).Scan(&chatID); err != nil {
		return 0, err
	}

	return chatID, nil
}

func (r *chatRepository) GetChatByID(ctx context.Context, chatID int) (*model.Chat, error) {
	sqlReq := `SELECT id, name, type, created_at from chats WHERE id = $1`

	var chat model.Chat
	if err := r.db.QueryRowContext(ctx, sqlReq, chatID).Scan(&chat.ID, &chat.Name, &chat.Type, &chat.CreatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &chat, nil
}

func (r *chatRepository) ListChatParticipantsID(ctx context.Context, chatID int) ([]int, error) {
	sqlReq := `SELECT user_id FROM chat_participants WHERE chat_id = $1`
	rows, err := r.db.QueryContext(ctx, sqlReq, chatID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []int
	for rows.Next() {
		var userID int
		if err = rows.Scan(&userID); err != nil {
			return userIDs, err
		}
		userIDs = append(userIDs, userID)
	}

	if err = rows.Err(); err != nil {
		return userIDs, err
	}

	return userIDs, nil
}
