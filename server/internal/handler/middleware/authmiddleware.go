package middleware

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"net/http"
)

type contextKey string

const (
	UserClaimsKey = contextKey("userClaims")
	JwtTokenKey   = "jwt_token"
)

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(JwtTokenKey)
			if err != nil {
				handler.ClientErrorResponse(w, http.StatusUnauthorized, "Authorization token not provided")
				return
			}
			tokenString := cookie.Value

			claims := &jwt.RegisteredClaims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, errors.New("unexpected signing method")
				}

				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				handler.ClientErrorResponse(w, http.StatusUnauthorized, "Invalid or expire token")
				return
			}

			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
