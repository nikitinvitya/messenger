package messagehandler

import (
	"errors"
	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/handler/helper"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/service/messageservice"
	"net/http"
	"strconv"
)

type MessageHandler struct {
	messageService messageservice.MessageService
}

func NewMessageHandler(messageService messageservice.MessageService) *MessageHandler {
	return &MessageHandler{
		messageService: messageService,
	}
}

func (h *MessageHandler) CreateMessage(w http.ResponseWriter, r *http.Request) {
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
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid chat ID in URL")
		return
	}

	var requestBody struct {
		Content          string `json:"content" validate:"required,min=1"`
		ReplyToMessageID *int   `json:"reply_to_message_id,omitempty"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	message, err := h.messageService.CreateMessage(r.Context(), userID, chatID, requestBody.Content, requestBody.ReplyToMessageID)
	if err != nil {
		switch {
		case errors.Is(err, messageservice.ErrAccessDenied):
			handler.ClientErrorResponse(w, http.StatusForbidden, "You are not a member of this chat")
			return
		case errors.Is(err, messageservice.ErrUserBlocked):
			handler.ClientErrorResponse(w, http.StatusForbidden, "You cannot send messages in this chat")
			return
		case errors.Is(err, messageservice.ErrCannotReplyToMessage):
			handler.ClientErrorResponse(w, http.StatusBadRequest, "You cannot reply to this message")
			return
		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to create message", err)
			return
		}
	}

	handler.SuccessResponse(w, http.StatusCreated, message)
}

func (h *MessageHandler) ListMessagesInChat(w http.ResponseWriter, r *http.Request) {
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
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid chat ID in URL")
		return
	}

	pageStr := r.URL.Query().Get("page")
	pageSizeStr := r.URL.Query().Get("pageSize")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 0 {
		pageSize = 20
	}

	limit := pageSize
	offset := (page - 1) * pageSize

	messages, err := h.messageService.ListMessagesInChat(r.Context(), userID, chatID, limit, offset)
	if err != nil {
		switch {
		case errors.Is(err, messageservice.ErrAccessDenied):
			handler.ClientErrorResponse(w, http.StatusForbidden, "You are not a member of this chat")
			return
		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to get list message", err)
			return
		}
	}

	handler.SuccessResponse(w, http.StatusOK, map[string][]model.Message{"messages": messages})
}

func (h *MessageHandler) UpdateMessage(w http.ResponseWriter, r *http.Request) {
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

	messageIDStr := chi.URLParam(r, "messageID")
	messageID, err := strconv.Atoi(messageIDStr)
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid message ID in URL")
		return
	}

	var requestBody struct {
		Content string `json:"content" validate:"required,min=1"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	message, err := h.messageService.UpdateMessage(r.Context(), userID, messageID, requestBody.Content)
	if err != nil {
		switch {
		case errors.Is(err, messageservice.ErrAccessDenied):
			handler.ClientErrorResponse(w, http.StatusForbidden, "You are not the author of this message")
			return
		case errors.Is(err, messageservice.ErrMessageNotFound):
			handler.ClientErrorResponse(w, http.StatusNotFound, "Message not found")
			return
		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to edit message", err)
			return
		}
	}

	handler.SuccessResponse(w, http.StatusOK, message)
}

func (h *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
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

	messageIDStr := chi.URLParam(r, "messageID")
	messageID, err := strconv.Atoi(messageIDStr)
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid message ID in URL")
		return
	}

	_, err = h.messageService.DeleteMessage(r.Context(), userID, messageID)
	if err != nil {
		switch {
		case errors.Is(err, messageservice.ErrAccessDenied):
			handler.ClientErrorResponse(w, http.StatusForbidden, "You can't delete this message")
			return
		case errors.Is(err, messageservice.ErrMessageNotFound):
			handler.ClientErrorResponse(w, http.StatusNotFound, "Message not found")
			return
		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to delete message", err)
			return
		}
	}

	handler.SuccessResponse(w, http.StatusNoContent, nil)
}

func (h *MessageHandler) ForwardMessage(w http.ResponseWriter, r *http.Request) {
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

	destinationChatIDStr := chi.URLParam(r, "chatID")
	destinationChatID, err := strconv.Atoi(destinationChatIDStr)
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid chat ID in URL")
		return
	}

	var requestBody struct {
		MessageIDs []int `json:"message_ids" validate:"required,min=1,dive,gt=0"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	err = h.messageService.ForwardMessage(r.Context(), userID, destinationChatID, requestBody.MessageIDs)
	if err != nil {
		switch {
		case errors.Is(err, messageservice.ErrAccessDenied):
			handler.ClientErrorResponse(w, http.StatusForbidden, "You can't forward this messages")
			return
		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to forward message", err)
			return
		}
	}

	handler.SuccessResponse(w, http.StatusNoContent, nil)
}
