package blocklistrepository

import (
	"context"
	"database/sql"
	"fmt"
)

type BlocklistRepository interface {
	Block(ctx context.Context, blockerID, blockedID int) error
	Unblock(ctx context.Context, blockerID, blockedID int) error
	IsBlocked(ctx context.Context, blockerID, blockedID int) (bool, error)
}

type blocklistRepository struct {
	db *sql.DB
}

func NewBlocklistRepository(db *sql.DB) BlocklistRepository {
	return &blocklistRepository{
		db: db,
	}
}

func (r *blocklistRepository) Block(ctx context.Context, blockerID, blockedID int) error {
	sqlReq := `INSERT INTO blocklist (blocker_id, blocked_id) VALUES ($1, $2)`

	_, err := r.db.ExecContext(ctx, sqlReq, blockerID, blockedID)
	return err
}

func (r *blocklistRepository) Unblock(ctx context.Context, blockerID, blockedID int) error {
	sqlReq := `DELETE FROM blocklist WHERE blocker_id = $1 AND blocked_id = $2`
	_, err := r.db.ExecContext(ctx, sqlReq, blockerID, blockedID)
	return err
}

func (r *blocklistRepository) IsBlocked(ctx context.Context, blockerID, blockedID int) (bool, error) {
	sqlReq := `SELECT EXISTS (
			   	SELECT 1 FROM blocklist
				WHERE (blocker_id = $1 AND blocked_id = $2) 
				)`

	var exist bool
	err := r.db.QueryRowContext(ctx, sqlReq, blockerID, blockedID).Scan(&exist)
	if err != nil {
		return false, fmt.Errorf("failed to check blocklist: %w", err)
	}

	return exist, nil
}
