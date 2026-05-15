package blocklistservice

import (
	"context"
	"errors"

	"github.com/nikitinvitya/messenger/internal/repository/blocklistrepository"
	"github.com/nikitinvitya/messenger/internal/websocket"
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
	hub           *websocket.Hub
}

func NewBlocklistService(blocklistRepo blocklistrepository.BlocklistRepository, hub *websocket.Hub) BlocklistService {
	return &blocklistService{
		blocklistRepo: blocklistRepo,
		hub:           hub,
	}
}

func (s *blocklistService) Block(ctx context.Context, blockerID, blockedID int) error {
	if blockerID == blockedID {
		return ErrCannotBlockSelf
	}

	if err := s.blocklistRepo.Block(ctx, blockerID, blockedID); err != nil {
		return err
	}

	s.hub.SendToUsers(websocket.EventUserBlocked, map[string]int{
		"blockerId": blockerID,
		"blockedId": blockedID,
	}, []int{blockerID, blockedID})

	return nil
}

func (s *blocklistService) Unblock(ctx context.Context, blockerID, blockedID int) error {
	if err := s.blocklistRepo.Unblock(ctx, blockerID, blockedID); err != nil {
		return err
	}

	s.hub.SendToUsers(websocket.EventUserUnblocked, map[string]int{
		"blockerId": blockerID,
		"blockedId": blockedID,
	}, []int{blockerID, blockedID})

	return nil
}

func (s *blocklistService) CheckBlock(ctx context.Context, blockerID, blockedID int) (bool, error) {
	isBlocked, err := s.blocklistRepo.IsBlocked(ctx, blockerID, blockedID)
	if err != nil {
		return false, err
	}

	return isBlocked, nil
}
