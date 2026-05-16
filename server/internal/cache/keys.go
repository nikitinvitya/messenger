package cache

import "fmt"

func UserChatsKey(userID int) string {
	return fmt.Sprintf("chats:user:%d", userID)
}

func UserByIDKey(userID int) string {
	return fmt.Sprintf("user:id:%d", userID)
}

// UserByUsernameKey must match DB username case exactly (usernames are case-sensitive).
func UserByUsernameKey(username string) string {
	return fmt.Sprintf("user:username:%s", username)
}

func ChatByIDKey(chatID, viewerID int) string {
	return fmt.Sprintf("chat:%d:viewer:%d", chatID, viewerID)
}
