package websocket

import (
	"encoding/json"
	"sync"
)

type EventType string
type MessageHandler func(userID int, message []byte)

const (
	EventMessageCreated EventType = "create_message"
	EventMessageUpdated EventType = "update_message"
	EventMessageDeleted EventType = "delete_message"
	EventUserLeftChat   EventType = "user_left_chat"
	EventChatCreated    EventType = "chat_created"
	EventChatUpdated    EventType = "chat_updated"
	EventChatDeleted    EventType = "chat_deleted"
	EventUserStatus     EventType = "user_status"
	EventMessagesRead   EventType = "messages_read"
)

type Event struct {
	Type    EventType   `json:"type"`
	Payload interface{} `json:"payload"`
}

type BroadcastMessage struct {
	Event         Event
	TargetUserIDs []int
}

type StatusUpdate struct {
	UserID int
	Online bool
}

type Hub struct {
	mu            sync.RWMutex
	clients       map[int]map[*Client]bool
	Broadcast     chan BroadcastMessage
	Register      chan *Client
	Unregister    chan *Client
	StatusUpdates chan StatusUpdate
	OnMessage     MessageHandler
}

func NewHub() *Hub {
	return &Hub{
		clients:       make(map[int]map[*Client]bool),
		Broadcast:     make(chan BroadcastMessage),
		Register:      make(chan *Client),
		Unregister:    make(chan *Client),
		StatusUpdates: make(chan StatusUpdate, 100),
	}
}

func (h *Hub) IsUserOnline(userID int) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, online := h.clients[userID]
	return online
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
			h.mu.Lock()
			isFirst := false
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*Client]bool)
				isFirst = true
			}
			h.clients[client.UserID][client] = true
			h.mu.Unlock()

			if isFirst {
				h.StatusUpdates <- StatusUpdate{UserID: client.UserID, Online: true}
			}

		case client := <-h.Unregister:
			h.mu.Lock()
			isLast := false
			if userClients, ok := h.clients[client.UserID]; ok {
				if _, ok := userClients[client]; ok {
					delete(userClients, client)
					close(client.Send)
					if len(userClients) == 0 {
						delete(h.clients, client.UserID)
						isLast = true
					}
				}
			}
			h.mu.Unlock()

			if isLast {
				h.StatusUpdates <- StatusUpdate{UserID: client.UserID, Online: false}
			}

		case bMsg := <-h.Broadcast:
			messageJSON, err := json.Marshal(bMsg.Event)
			if err != nil {
				continue
			}
			h.mu.RLock()
			for _, userID := range bMsg.TargetUserIDs {
				if userClients, ok := h.clients[userID]; ok {
					for client := range userClients {
						select {
						case client.Send <- messageJSON:
						default:
							close(client.Send)
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}
