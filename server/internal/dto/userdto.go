package dto

type UserSearchResponse struct {
	ID        int     `json:"id"`
	Username  string  `json:"username"`
	Bio       *string `json:"bio"`
	AvatarURL *string `json:"avatarURL"`
}
