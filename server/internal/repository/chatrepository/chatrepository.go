package chatrepository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/model"
)

type ChatRepository interface {
	CreateChat(ctx context.Context, name *string, chatType string, userIDs []int) (int, error)
	ListUserChats(ctx context.Context, userID int) ([]*dto.ChatResponse, error)
	IsUserInChat(ctx context.Context, userID int, chatID int) (bool, error)
	FindPrivateChatByParticipants(ctx context.Context, userID1 int, userID2 int) (int, error)
	GetChatByID(ctx context.Context, chatID int) (*model.Chat, error)
	ListChatParticipantsID(ctx context.Context, chatID int) ([]int, error)
	ListChatParticipants(ctx context.Context, chatID int) ([]model.User, error)
	LeaveChat(ctx context.Context, chatID int, userID int) error
	CountChatParticipants(ctx context.Context, chatID int) (int, error)
	DeleteChat(ctx context.Context, chatID int) error
	UpdateChat(ctx context.Context, chatID int, name *string, avatarURL *string) error
	GetContactIDs(ctx context.Context, userID int) ([]int, error)
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

func (r *chatRepository) ListUserChats(ctx context.Context, userID int) ([]*dto.ChatResponse, error) {
	sqlReq := `SELECT 
			c.id, 
			c.name, 
			c.type, 
			c.created_at,
			c.avatar_url,
			last_msg.id as last_message_id,
			last_msg.content as last_message_content,
			last_msg.created_at as last_message_created_at
		FROM 
			chats c
		JOIN 
			chat_participants cp ON c.id = cp.chat_id
		LEFT JOIN LATERAL (
			SELECT id, content, created_at
			FROM messages
			WHERE chat_id = c.id
			ORDER BY created_at DESC
			LIMIT 1
		) last_msg ON true
		WHERE 
			cp.user_id = $1
		ORDER BY 
			COALESCE(last_msg.created_at, c.created_at) DESC`

	rows, err := r.db.QueryContext(ctx, sqlReq, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	chats := make([]*dto.ChatResponse, 0)
	for rows.Next() {
		var chat dto.ChatResponse
		var lastMessage dto.LastMessage
		var lastMessageID sql.NullInt64
		var lastMessageContent sql.NullString
		var lastMessageCreatedAt sql.NullTime
		var avatarURL sql.NullString

		if err = rows.Scan(
			&chat.ID,
			&chat.Name,
			&chat.Type,
			&chat.CreatedAt,
			&avatarURL,
			&lastMessageID,
			&lastMessageContent,
			&lastMessageCreatedAt,
		); err != nil {
			return chats, err
		}

		if avatarURL.Valid {
			chat.AvatarURL = &avatarURL.String
		}

		if lastMessageID.Valid {
			lastMessage.ID = int(lastMessageID.Int64)
			lastMessage.Content = lastMessageContent.String
			lastMessage.CreatedAt = lastMessageCreatedAt.Time
			chat.LastMessage = &lastMessage
		}

		chats = append(chats, &chat)
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
	sqlReq := `SELECT id, name, type, created_at, avatar_url from chats WHERE id = $1`

	var chat model.Chat
	if err := r.db.QueryRowContext(ctx, sqlReq, chatID).Scan(
		&chat.ID,
		&chat.Name,
		&chat.Type,
		&chat.CreatedAt,
		&chat.AvatarURL,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get chat by id: %w", err)
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

	userIDs := make([]int, 0)
	for rows.Next() {
		var userID int
		if err = rows.Scan(&userID); err != nil {
			return userIDs, err
		}
		userIDs = append(userIDs, userID)
	}

	return userIDs, nil
}

func (r *chatRepository) ListChatParticipants(ctx context.Context, chatID int) ([]model.User, error) {
	sqlReq := `SELECT U.id, U.email, U.username, U.created_at, U.bio, U.avatar_url
			   FROM users U
			   JOIN chat_participants CP ON CP.user_id = U.id
			   WHERE CP.chat_id = $1`

	rows, err := r.db.QueryContext(ctx, sqlReq, chatID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.User, 0)
	for rows.Next() {
		var user model.User
		if err = rows.Scan(
			&user.ID,
			&user.Email,
			&user.Username,
			&user.CreatedAt,
			&user.Bio,
			&user.AvatarURL,
		); err != nil {
			return result, err
		}

		result = append(result, user)
	}

	return result, nil
}

func (r *chatRepository) LeaveChat(ctx context.Context, chatID int, userID int) error {
	sqlReq := `DELETE from chat_participants where user_id = $1 and chat_id = $2`
	result, err := r.db.ExecContext(ctx, sqlReq, userID, chatID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *chatRepository) CountChatParticipants(ctx context.Context, chatID int) (int, error) {
	sqlReq := `SELECT count(*) FROM chat_participants WHERE chat_id = $1`
	var count int
	err := r.db.QueryRowContext(ctx, sqlReq, chatID).Scan(&count)
	return count, err
}

func (r *chatRepository) DeleteChat(ctx context.Context, chatID int) error {
	sqlReq := `DELETE FROM chats WHERE id = $1`
	_, err := r.db.ExecContext(ctx, sqlReq, chatID)
	return err
}

func (r *chatRepository) UpdateChat(ctx context.Context, chatID int, name *string, avatarURL *string) error {
	sqlReq := `UPDATE chats SET name = $1, avatar_url = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, sqlReq, name, avatarURL, chatID)
	return err
}

func (r *chatRepository) GetContactIDs(ctx context.Context, userID int) ([]int, error) {
	sqlReq := `
		SELECT DISTINCT user_id 
		FROM chat_participants 
		WHERE chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = $1)
		AND user_id != $1`

	rows, err := r.db.QueryContext(ctx, sqlReq, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}
