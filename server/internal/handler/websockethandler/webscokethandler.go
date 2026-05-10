package websockethandler

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
	gorillaWebsocket "github.com/gorilla/websocket"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/chatservice"
	"github.com/nikitinvitya/messenger/internal/websocket"
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
	hub.OnMessage = func(userID int, message []byte) {
		var event websocket.Event
		if err := json.Unmarshal(message, &event); err != nil {
			return
		}

		if event.Type == "read_messages" {
			payload, ok := event.Payload.(map[string]interface{})
			if !ok {
				return
			}

			chatID := int(payload["chatID"].(float64))
			messageID := int(payload["messageID"].(float64))

			ctx := context.Background()
			_ = chatService.UpdateLastReadMessage(ctx, chatID, userID, messageID)

			participants, _ := chatService.ListChatParticipantsID(ctx, chatID)

			hub.SendToUsers(websocket.EventMessagesRead, map[string]interface{}{
				"chatID":      chatID,
				"userID":      userID,
				"messageID":   messageID,
				"unreadCount": 0,
			}, participants)
		}
	}

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
	}

	client.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()

	slog.Info("websocket connected", "userID", userID)
}

func (h *WebsocketHandler) HandlePresence() {
	for update := range h.hub.StatusUpdates {
		contactIDs, err := h.chatService.GetContactIDs(context.Background(), update.UserID)
		if err != nil {
			continue
		}

		h.hub.SendToUsers(websocket.EventUserStatus, map[string]interface{}{
			"userId": update.UserID,
			"online": update.Online,
		}, contactIDs)
	}
}
