package userhandler

import (
	"net/http"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/handler/helper"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/service/userservice"
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

func (h *UserHandler) SearchUsersByUsername(w http.ResponseWriter, r *http.Request) {
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

	username := r.URL.Query().Get("username")
	if username == "" {
		handler.SuccessResponse(w, http.StatusOK, make([]dto.UserSearchResponse, 0))
		return
	}

	users, err := h.service.SearchUsersByUsername(r.Context(), userId, username)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to get user", err)
		return
	}

	response := make([]dto.UserSearchResponse, 0, len(users))
	for _, user := range users {
		response = append(response, dto.UserSearchResponse{
			ID:        user.ID,
			Username:  user.Username,
			AvatarURL: user.AvatarURL,
			Bio:       user.Bio,
		})
	}

	handler.SuccessResponse(w, http.StatusOK, response)
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
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

	var requestBody struct {
		Username  string  `json:"username" validate:"required,min=3,max=32"`
		Bio       *string `json:"bio"`
		AvatarURL *string `json:"avatarURL"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	var updatedUser *model.User
	updatedUser, err = h.service.UpdateProfile(r.Context(), userId, requestBody.Username, requestBody.Bio, requestBody.AvatarURL)
	if err != nil {
		if err.Error() == "username already taken" {
			handler.ClientErrorResponse(w, http.StatusConflict, "Username is already taken")
			return
		}
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to update user", err)
		return
	}
	handler.SuccessResponse(w, http.StatusOK, updatedUser)
}
