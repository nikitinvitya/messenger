package model

const (
	ChatTypePrivate = "private"
	ChatTypeGroup   = "group"
	ChatTypeSaved   = "saved"
)

const SavedChatDisplayName = "Saved Messages"

func IsSavedChatType(chatType string) bool {
	return chatType == ChatTypeSaved
}
