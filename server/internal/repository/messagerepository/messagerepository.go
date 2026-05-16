package messagerepository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/pkg/messagecrypto"
)

type MessageRepository interface {
	CreateMessage(ctx context.Context, message *model.Message) (int, error)
	ListMessagesInChat(ctx context.Context, chatID int, limit, offset int) ([]*dto.MessageResponse, error)
	UpdateMessage(ctx context.Context, messageID int, newContent string) error
	GetMessageByID(ctx context.Context, messageID int) (*model.Message, error)
	DeleteMessage(ctx context.Context, messageID int) error
	ClearChatMessages(ctx context.Context, chatID int) error
}

type messageRepository struct {
	db     *sql.DB
	cipher *messagecrypto.Cipher
}

func NewMessageRepository(db *sql.DB, cipher *messagecrypto.Cipher) MessageRepository {
	return &messageRepository{
		db:     db,
		cipher: cipher,
	}
}

func (r *messageRepository) CreateMessage(ctx context.Context, message *model.Message) (int, error) {
	sqlReq := `INSERT INTO messages (chat_id,
    		    					 sender_id,
    		    					 content,
    		    					 reply_to_message_id,
    		    					 forwarded_from_user_id,
    		    					 forwarded_from_chat_id,
                      				 image_url,
                      				 type)
			   VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`

	encryptedContent, err := r.cipher.EncryptContent(message.Content)
	if err != nil {
		return 0, fmt.Errorf("encrypt message content: %w", err)
	}

	var messageID int
	err = r.db.QueryRowContext(ctx,
		sqlReq,
		message.ChatID,
		message.SenderID,
		encryptedContent,
		message.ReplyToMessageID,
		message.ForwardedFromUserID,
		message.ForwardedFromChatID,
		message.ImageURL,
		message.Type,
	).Scan(&messageID)
	if err != nil {
		return 0, err
	}

	return messageID, nil
}

func (r *messageRepository) ListMessagesInChat(ctx context.Context, chatID int, limit, offset int) ([]*dto.MessageResponse, error) {
	sqlReq := `SELECT M.id,
       				  M.chat_id,
       				  M.content,
       				  M.created_at,
       				  M.edited_at,
       				  M.reply_to_message_id,
       				  M.forwarded_from_user_id,
       				  M.forwarded_from_chat_id,
       				  M.image_url,
       				  M.type,
					  U.id as sender_id, 
					  U.username as sender_username,
					  U.avatar_url
			   FROM messages M
			   JOIN users U on M.sender_id = U.id
			   WHERE M.chat_id = $1
			   ORDER BY M.created_at DESC
			   LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, sqlReq, chatID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messagesResponse := make([]*dto.MessageResponse, 0)
	for rows.Next() {

		var message dto.MessageResponse
		var senderInfo dto.SenderInfo

		var encryptedContent string
		if err = rows.Scan(
			&message.ID,
			&message.ChatID,
			&encryptedContent,
			&message.CreatedAt,
			&message.EditedAt,
			&message.ReplyToMessageID,
			&message.ForwardedFromUserID,
			&message.ForwardedFromChatID,
			&message.ImageURL,
			&message.Type,
			&senderInfo.ID,
			&senderInfo.Username,
			&senderInfo.AvatarURL,
		); err != nil {
			return messagesResponse, err
		}

		message.Content, err = r.cipher.DecryptContent(encryptedContent)
		if err != nil {
			return messagesResponse, fmt.Errorf("decrypt message %d content: %w", message.ID, err)
		}

		message.Sender = &senderInfo
		messagesResponse = append(messagesResponse, &message)
	}

	if err = rows.Err(); err != nil {
		return messagesResponse, err
	}

	return messagesResponse, nil
}

func (r *messageRepository) UpdateMessage(ctx context.Context, messageID int, newContent string) error {
	encryptedContent, err := r.cipher.EncryptContent(newContent)
	if err != nil {
		return fmt.Errorf("encrypt message content: %w", err)
	}

	sqlReq := `UPDATE messages
               SET content = $1, edited_at = NOW()
               WHERE id = $2`

	sqlResponse, err := r.db.ExecContext(ctx, sqlReq, encryptedContent, messageID)
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
	sqlReq := `SELECT id, sender_id, chat_id, content, created_at, edited_at, reply_to_message_id, forwarded_from_user_id, forwarded_from_chat_id, image_url, type
			   FROM messages
			   WHERE id = $1`

	var message model.Message
	var encryptedContent string
	err := r.db.QueryRowContext(ctx, sqlReq, messageID).Scan(
		&message.ID,
		&message.SenderID,
		&message.ChatID,
		&encryptedContent,
		&message.CreatedAt,
		&message.EditedAt,
		&message.ReplyToMessageID,
		&message.ForwardedFromUserID,
		&message.ForwardedFromChatID,
		&message.ImageURL,
		&message.Type,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, fmt.Errorf("failed to get message by id: %w", err)
	}

	message.Content, err = r.cipher.DecryptContent(encryptedContent)
	if err != nil {
		return nil, fmt.Errorf("decrypt message %d content: %w", message.ID, err)
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

func (r *messageRepository) ClearChatMessages(ctx context.Context, chatID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err = tx.ExecContext(ctx, `DELETE FROM messages WHERE chat_id = $1`, chatID); err != nil {
		return fmt.Errorf("clear messages: %w", err)
	}

	if _, err = tx.ExecContext(ctx,
		`UPDATE chat_participants SET last_read_message_id = 0 WHERE chat_id = $1`,
		chatID,
	); err != nil {
		return fmt.Errorf("reset read pointers: %w", err)
	}

	return tx.Commit()
}
