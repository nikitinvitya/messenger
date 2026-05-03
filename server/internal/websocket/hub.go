package websocket

import (
	"encoding/json"
	"log/slog"
)

type EventType string

const (
	EventMessageCreated EventType = "create_message"
	EventMessageUpdated EventType = "update_message"
	EventMessageDeleted EventType = "delete_message"
	EventUserLeftChat   EventType = "user_left_chat"
	EventChatCreated    EventType = "chat_created"
	EventChatUpdated    EventType = "chat_updated"
	EventChatDeleted    EventType = "chat_deleted"
)

type Event struct {
	Type    EventType   `json:"type"`
	Payload interface{} `json:"payload"`
}

type BroadcastMessage struct {
	Event         Event
	TargetUserIDs []int
}

type Hub struct {
	clients    map[int]map[*Client]bool
	Broadcast  chan BroadcastMessage
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[int]map[*Client]bool),
		Broadcast:  make(chan BroadcastMessage),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) SendToUsers(eventType EventType, payload interface{}, userIDs []int) {
	if len(userIDs) == 0 {
		return
	}

	h.Broadcast <- BroadcastMessage{
		Event: Event{
			Type:    eventType,
			Payload: payload,
		},
		TargetUserIDs: userIDs,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			slog.Info("client registered globally", "userID", client.UserID)

		case client := <-h.Unregister:
			if userClients, ok := h.clients[client.UserID]; ok {
				if _, ok := userClients[client]; ok {
					delete(userClients, client)
					close(client.Send)
					if len(userClients) == 0 {
						delete(h.clients, client.UserID)
					}
				}
			}
			slog.Info("client unregistered", "userID", client.UserID)

		case bMsg := <-h.Broadcast:
			messageJSON, err := json.Marshal(bMsg.Event)
			if err != nil {
				slog.Error("failed to marshal message", "error", err)
				continue
			}

			for _, userID := range bMsg.TargetUserIDs {
				if userClients, ok := h.clients[userID]; ok {
					for client := range userClients {
						select {
						case client.Send <- messageJSON:
						default:
							close(client.Send)
							delete(userClients, client)
						}
					}
				}
			}
		}
	}
}
