package messagerepository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"github.com/nikitinvitya/messenger/internal/model"
)

type MessageRepository interface {
	CreateMessage(ctx context.Context, message *model.Message) (int, error)
	ListMessagesInChat(ctx context.Context, chatID int, limit, offset int) ([]model.Message, error)
	UpdateMessage(ctx context.Context, messageID int, newContent string) error
	GetMessageByID(ctx context.Context, messageID int) (*model.Message, error)
	DeleteMessage(ctx context.Context, messageID int) error
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
	sqlReq := `INSERT INTO messages (chat_id, sender_id, content, reply_to_message_id) VALUES ($1, $2, $3, $4) RETURNING id`

	var messageID int
	err := r.db.QueryRowContext(ctx, sqlReq, message.ChatID, message.SenderID, message.Content, message.ReplyToMessageID).Scan(&messageID)
	if err != nil {
		return 0, err
	}

	return messageID, nil
}

func (r *messageRepository) ListMessagesInChat(ctx context.Context, chatID int, limit, offset int) ([]model.Message, error) {
	sqlReq := `SELECT id, chat_id, sender_id, content, created_at, edited_at, reply_to_message_id
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
		if err = rows.Scan(&message.ID, &message.ChatID, &message.SenderID, &message.Content, &message.CreatedAt, &message.EditedAt, &message.ReplyToMessageID); err != nil {
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

func (r *messageRepository) GetMessageByID(ctx context.Context, messageID int) (*model.Message, error) {
	sqlReq := `SELECT id, sender_id, chat_id, content, created_at, edited_at, reply_to_message_id
			   FROM messages
			   WHERE id = $1`

	var message model.Message
	err := r.db.QueryRowContext(ctx, sqlReq, messageID).Scan(
		&message.ID,
		&message.SenderID,
		&message.ChatID,
		&message.Content,
		&message.CreatedAt,
		&message.EditedAt,
		&message.ReplyToMessageID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, fmt.Errorf("failed to get message by id: %w", err)
	}

	return &message, nil
}

func (r *messageRepository) DeleteMessage(ctx context.Context, messageID int) error {
	sqlReq := `DELETE FROM messages WHERE id = $1`

	result, err := r.db.ExecContext(ctx, sqlReq, messageID)

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
