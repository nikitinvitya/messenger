package chatrepository

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/nikitinvitya/messenger/internal/model"
)

type ChatRepository interface {
	CreateChat(ctx context.Context, name *string, userIDs []int) (int, error)
	ListUserChats(ctx context.Context, userID int) ([]model.Chat, error)
	IsUserInChat(ctx context.Context, userID int, chatID int) (bool, error)
}

type chatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) ChatRepository {
	return &chatRepository{
		db: db,
	}
}

func (r *chatRepository) CreateChat(ctx context.Context, name *string, userIDs []int) (int, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	sqlReqCreateChat := `INSERT INTO chats (name) VALUES ($1) RETURNING id`
	var chatID int
	if err = tx.QueryRowContext(ctx, sqlReqCreateChat, name).Scan(&chatID); err != nil {
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
