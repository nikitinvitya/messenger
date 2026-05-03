package model

import "time"

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Username     string    `json:"username"`
	CreatedAt    time.Time `json:"createdAt"`
	Bio          *string   `json:"bio"`
	AvatarURL    *string   `json:"avatarURL"`
	IsOnline     bool      `json:"isOnline"`
}
