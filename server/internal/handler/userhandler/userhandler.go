package userhandler

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/userservice"
	"net/http"
	"strconv"
)

type UserHandler struct {
	service userservice.UserService
}

func NewUserHandler(service userservice.UserService) *UserHandler {
	return &UserHandler{
		service: service,
	}
}

func (h *UserHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*jwt.RegisteredClaims)
	if !ok {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve user claims", nil)
		return
	}

	userId, err := strconv.Atoi(claims.Subject)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to get claims subject", nil)
		return
	}

	user, err := h.service.GetProfile(r.Context(), userId)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to get user", err)
		return
	}

	if user == nil {
		handler.ClientErrorResponse(w, http.StatusNotFound, "User not found")
		return
	}

	handler.SuccessResponse(w, http.StatusOK, user)
}
