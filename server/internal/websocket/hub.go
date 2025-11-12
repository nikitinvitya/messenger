package websocket

import (
	"encoding/json"
	"log/slog"
)

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type Broadcaster interface {
	GetChatID() int
}

type Hub struct {
	rooms      map[int]map[*Client]bool
	Broadcast  chan Event
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[int]map[*Client]bool),
		Broadcast:  make(chan Event),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			room, ok := h.rooms[client.ChatID]
			if !ok {
				room = make(map[*Client]bool)
				h.rooms[client.ChatID] = room
			}

			room[client] = true
			slog.Info("client registered", "userID", client.UserID, "chatID", client.ChatID)
		case client := <-h.Unregister:
			if room, ok := h.rooms[client.ChatID]; ok {
				if _, ok = room[client]; ok {
					delete(room, client)
					close(client.Send)
					if len(room) == 0 {
						delete(h.rooms, client.ChatID)
					}
				}
			}
			slog.Info("client unregistered", "userID", client.UserID, "chatID", client.ChatID)
		case event := <-h.Broadcast:
			payloadWithChatID, ok := event.Payload.(Broadcaster)
			if !ok {
				slog.Error("broadcast event payload does not implement Broadcaster interface")
				continue
			}
			chatID := payloadWithChatID.GetChatID()

			if room, ok := h.rooms[chatID]; ok {
				slog.Info("broadcasting event", "type", event.Type, "chatID", chatID, "clients_in_room", len(room))

				messageJSON, err := json.Marshal(event)
				if err != nil {
					slog.Error("failed to marshal message for broadcast", "error", err)
					continue
				}

				for client := range room {
					select {
					case client.Send <- messageJSON:
					default:
						close(client.Send)
						delete(room, client)
					}
				}
			}
		}
	}
}
