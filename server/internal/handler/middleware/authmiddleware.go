package middleware

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"net/http"
	"strings"
)

type contextKey string

const UserClaimsKey = contextKey("userClaims")

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")

			if authHeader == "" {
				handler.ClientErrorResponse(w, http.StatusUnauthorized, "Missing auth header")
				return
			}

			headerParts := strings.Split(authHeader, " ")
			if len(headerParts) != 2 || headerParts[0] != "Bearer" {
				handler.ClientErrorResponse(w, http.StatusUnauthorized, "Invalid authorization header")
				return
			}
			tokenString := headerParts[1]

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
