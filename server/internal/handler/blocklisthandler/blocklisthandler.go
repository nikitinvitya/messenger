package blocklisthandler

import (
	"errors"
	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/blocklistservice"
	"net/http"
	"strconv"
)

type BlocklistHandler struct {
	blocklistService blocklistservice.BlocklistService
}

func NewBlocklistHandler(blocklistService blocklistservice.BlocklistService) *BlocklistHandler {
	return &BlocklistHandler{
		blocklistService: blocklistService,
	}
}

func (h *BlocklistHandler) Block(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*jwt.RegisteredClaims)
	if !ok {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve user claims", nil)
		return
	}

	userID, err := strconv.Atoi(claims.Subject)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Invalid user ID in token", err)
		return
	}

	blockedUserIDStr := chi.URLParam(r, "userID")
	blockedUserID, err := strconv.Atoi(blockedUserIDStr)
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid user ID in URL")
		return
	}

	err = h.blocklistService.Block(r.Context(), userID, blockedUserID)
	if err != nil {
		if errors.Is(err, blocklistservice.ErrCannotBlockSelf) {
			handler.ClientErrorResponse(w, http.StatusBadRequest, "You can't block yourself")
			return
		}

		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to block user", err)
		return
	}

	handler.SuccessResponse(w, http.StatusNoContent, nil)
}

func (h *BlocklistHandler) Unblock(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*jwt.RegisteredClaims)
	if !ok {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve user claims", nil)
		return
	}

	userID, err := strconv.Atoi(claims.Subject)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Invalid user ID in token", err)
		return
	}

	blockedUserIDStr := chi.URLParam(r, "userID")
	blockedUserID, err := strconv.Atoi(blockedUserIDStr)
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid user ID in URL")
		return
	}

	err = h.blocklistService.Unblock(r.Context(), userID, blockedUserID)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to unblock user", err)
		return
	}

	handler.SuccessResponse(w, http.StatusNoContent, nil)
}
