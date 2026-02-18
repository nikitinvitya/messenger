package chathandler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/handler/helper"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/chatservice"
	"github.com/nikitinvitya/messenger/internal/service/messageservice"
)

type ChatHandler struct {
	chatService chatservice.ChatService
}

func NewChatHandler(chatService chatservice.ChatService) *ChatHandler {
	return &ChatHandler{
		chatService: chatService,
	}
}

func (h *ChatHandler) CreateChat(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*jwt.RegisteredClaims)
	if !ok {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve user claims", nil)
		return
	}

	creatorID, err := strconv.Atoi(claims.Subject)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Invalid user ID in token", err)
		return
	}

	var requestBody struct {
		UserIDs  []int   `json:"userIDs" validate:"required,min=1,dive,gt=0"`
		Name     *string `json:"name,omitempty"`
		ChatType string  `json:"chatType"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	chatID, err := h.chatService.CreateChat(r.Context(), requestBody.UserIDs, requestBody.ChatType, requestBody.Name, creatorID)
	if err != nil {
		if errors.Is(err, chatservice.ErrInvalidChatName) {
			handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid chat name")
			return
		}
		if errors.Is(err, chatservice.ErrInvalidChatType) {
			handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid chat type")
			return
		}
		if errors.Is(err, chatservice.ErrInvalidParticipantsCount) {
			handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid participant count")
			return
		}

		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to create chat", err)
		return
	}

	handler.SuccessResponse(w, http.StatusCreated, map[string]int{"chatID": chatID})
}

func (h *ChatHandler) ListUserChats(w http.ResponseWriter, r *http.Request) {
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

	chats, err := h.chatService.ListUserChats(r.Context(), userID)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to get user chats", err)
		return
	}

	handler.SuccessResponse(w, http.StatusOK, map[string][]*dto.ChatResponse{"chats": chats})
}

func (h *ChatHandler) GetChatByID(w http.ResponseWriter, r *http.Request) {
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

	chatIDStr := chi.URLParam(r, "chatID")
	chatID, err := strconv.Atoi(chatIDStr)
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid chat id")
		return
	}

	chatInfo, err := h.chatService.GetChatByID(r.Context(), userID, chatID)
	if err != nil {
		if errors.Is(err, messageservice.ErrAccessDenied) {
			handler.ClientErrorResponse(w, http.StatusForbidden, "Access to this chat is denied")
			return
		}
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to get chat info", err)
		return
	}

	handler.SuccessResponse(w, http.StatusOK, chatInfo)
}

func (h *ChatHandler) LeaveChat(w http.ResponseWriter, r *http.Request) {
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

	chatIDStr := chi.URLParam(r, "chatID")
	chatID, err := strconv.Atoi(chatIDStr)

	err = h.chatService.LeaveChat(r.Context(), userID, chatID)
	if err != nil {
		if errors.Is(err, messageservice.ErrAccessDenied) {
			handler.ClientErrorResponse(w, http.StatusForbidden, "You are not a member of this chat")
			return
		}
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to leave chat", err)
		return
	}

	handler.SuccessResponse(w, http.StatusNoContent, nil)
}
