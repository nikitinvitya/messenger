package middleware

import (
	"context"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/authservice"
	"net/http"
	"strings"
)

type contextKey string

const (
	UserClaimsKey = contextKey("userClaims")
	JwtTokenKey   = "jwt_token"
)

func contains(slice []string, value string) bool {
	for _, item := range slice {
		if item == value {
			return true
		}
	}
	return false
}

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			isWsRequest := strings.HasPrefix(r.URL.Path, "/api/v1/ws/")

			var tokenString string
			if isWsRequest {
				tokenString = r.URL.Query().Get("token")
			} else {
				cookie, err := r.Cookie(JwtTokenKey)
				if err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				handler.ClientErrorResponse(w, http.StatusUnauthorized, "Authorization token not provided")
				return
			}

			claims := &jwt.RegisteredClaims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				handler.ClientErrorResponse(w, http.StatusUnauthorized, "Invalid or expired token")
				return
			}

			if isWsRequest {
				if !contains(claims.Audience, authservice.WS_KEY) {
					handler.ClientErrorResponse(w, http.StatusForbidden, "Invalid token for WebSocket connection")
					return
				}
			} else {
				if !contains(claims.Audience, authservice.HTTP_KEY) {
					handler.ClientErrorResponse(w, http.StatusForbidden, "Invalid token for HTTP session")
					return
				}
			}

			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
