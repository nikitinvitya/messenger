package messagerepository

import (
	"context"
	"database/sql"
	"fmt"
	"github.com/nikitinvitya/messenger/internal/model"
)

type MessageRepository interface {
	CreateMessage(ctx context.Context, message *model.Message) (int, error)
	ListMessagesInChat(ctx context.Context, chatID int, limit, offset int) ([]model.Message, error)
	UpdateMessage(ctx context.Context, messageID int, newContent string) error
}

type messageRepository struct {
	db *sql.DB
}

func NewMessageRepository(db *sql.DB) MessageRepository {
	return &messageRepository{
		db: db,
	}
}

func (r *messageRepository) CreateMessage(ctx context.Context, message *model.Message) (int, error) {
	sqlReq := `INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id`

	var messageID int
	err := r.db.QueryRowContext(ctx, sqlReq, message.ChatID, message.SenderID, message.Content).Scan(&messageID)
	if err != nil {
		return 0, err
	}

	return messageID, nil
}

func (r *messageRepository) ListMessagesInChat(ctx context.Context, chatID int, limit, offset int) ([]model.Message, error) {
	sqlReq := `SELECT id, chat_id, sender_id, content, created_at, edited_at
			   FROM messages
			   WHERE chat_id = $1
			   ORDER BY created_at DESC
			   LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, sqlReq, chatID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []model.Message
	for rows.Next() {
		var message model.Message
		if err = rows.Scan(&message.ID, &message.ChatID, &message.SenderID, &message.Content, &message.CreatedAt, &message.EditedAt); err != nil {
			return messages, err
		}

		messages = append(messages, message)
	}

	if err = rows.Err(); err != nil {
		return messages, err
	}

	return messages, nil
}

func (r *messageRepository) UpdateMessage(ctx context.Context, messageID int, newContent string) error {
	sqlReq := `UPDATE messages
               SET content = $1, edited_at = NOW()
               WHERE id = $2`

	sqlResponse, err := r.db.ExecContext(ctx, sqlReq, newContent, messageID)
	if err != nil {
		return err
	}

	rowsAffected, err := sqlResponse.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected")
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
