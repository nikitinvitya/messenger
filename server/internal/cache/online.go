package cache

import (
	"github.com/nikitinvitya/messenger/internal/dto"
	"github.com/nikitinvitya/messenger/internal/model"
	"github.com/nikitinvitya/messenger/internal/websocket"
)

func RefreshUserOnline(user *model.User, hub *websocket.Hub) {
	if user != nil {
		user.IsOnline = hub.IsUserOnline(user.ID)
	}
}

func RefreshChatsOnline(chats []*dto.ChatResponse, hub *websocket.Hub) {
	for _, chat := range chats {
		for i := range chat.Participants {
			chat.Participants[i].IsOnline = hub.IsUserOnline(chat.Participants[i].ID)
		}
	}
}

func RefreshChatOnline(chat *dto.ChatResponse, hub *websocket.Hub) {
	if chat == nil {
		return
	}
	for i := range chat.Participants {
		chat.Participants[i].IsOnline = hub.IsUserOnline(chat.Participants[i].ID)
	}
}
