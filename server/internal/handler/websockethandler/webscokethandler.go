package websockethandler

import (
	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	gorillaWebsocket "github.com/gorilla/websocket"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/chatservice"
	"github.com/nikitinvitya/messenger/internal/websocket"
	"log/slog"
	"net/http"
	"strconv"
)

var upgrader = gorillaWebsocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WebsocketHandler struct {
	hub         *websocket.Hub
	chatService chatservice.ChatService
}

func NewWebsocketHandler(hub *websocket.Hub, chatService chatservice.ChatService) *WebsocketHandler {
	return &WebsocketHandler{
		hub:         hub,
		chatService: chatService,
	}
}

func (h *WebsocketHandler) ServeWs(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*jwt.RegisteredClaims)
	if !ok {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve user claims", nil)
		return
	}

	userID, err := strconv.Atoi(claims.Subject)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Invalid user id in token", err)
		return
	}

	chatIDStr := chi.URLParam(r, "chatID")
	chatID, err := strconv.Atoi(chatIDStr)
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid chat ID in URL")
		return
	}

	isParticipant, err := h.chatService.IsUserInChat(r.Context(), userID, chatID)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to check chat participation", err)
		return
	}
	if !isParticipant {
		handler.ClientErrorResponse(w, http.StatusForbidden, "You are not a member of this chat")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("failed to upgrade connection", "error", err)
		return
	}

	client := &websocket.Client{
		Hub:    h.hub,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		UserID: userID,
		ChatID: chatID,
	}
	client.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()

	slog.Info("websocket client connected and registered", "userID", userID, "chatID", chatID)
}
