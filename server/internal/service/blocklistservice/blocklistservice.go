package blocklistservice

import (
	"context"
	"errors"
	"github.com/nikitinvitya/messenger/internal/repository/blocklistrepository"
)

var (
	ErrCannotBlockSelf = errors.New("you can't block yourself")
)

type BlocklistService interface {
	Block(ctx context.Context, blockerID, blockedID int) error
	Unblock(ctx context.Context, blockerID, blockedID int) error
	CheckBlock(ctx context.Context, blockerID, blockedID int) (bool, error)
}

type blocklistService struct {
	blocklistRepo blocklistrepository.BlocklistRepository
}

func NewBlocklistService(blocklistRepo blocklistrepository.BlocklistRepository) BlocklistService {
	return &blocklistService{
		blocklistRepo: blocklistRepo,
	}
}

func (s *blocklistService) Block(ctx context.Context, blockerID, blockedID int) error {
	if blockerID == blockedID {
		return ErrCannotBlockSelf
	}

	return s.blocklistRepo.Block(ctx, blockerID, blockedID)
}

func (s *blocklistService) Unblock(ctx context.Context, blockerID, blockedID int) error {
	return s.blocklistRepo.Unblock(ctx, blockerID, blockedID)
}

func (s *blocklistService) CheckBlock(ctx context.Context, blockerID, blockedID int) (bool, error) {
	isBlocked, err := s.blocklistRepo.IsBlocked(ctx, blockerID, blockedID)
	if err != nil {
		return false, err
	}

	return isBlocked, nil
}
