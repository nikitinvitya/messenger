package chathandler

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/handler/helper"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/service/chatservice"
	"github.com/nikitinvitya/messenger/internal/service/messageservice"
	"net/http"
	"strconv"
)

type ChatHandler struct {
	chatService chatservice.ChatService
}

func NewChatHandler(chatService chatservice.ChatService, messageService messageservice.MessageService) *ChatHandler {
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
		UserIDs []int `json:"user_ids" validate:"required,min=1,dive,gt=0"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	chatID, err := h.chatService.CreateChat(r.Context(), requestBody.UserIDs, creatorID)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to create chat", err)
		return
	}

	handler.SuccessResponse(w, http.StatusCreated, map[string]int{"chat_id": chatID})
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

	handler.SuccessResponse(w, http.StatusOK, map[string][]model.Chat{"chats": chats})
}
