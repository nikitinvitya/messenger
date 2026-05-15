package authhandler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/nikitinvitya/messenger/internal/handler/helper"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	"github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/authservice"
)

const (
	JWT_TOKEN_KEY = "jwt_token"
)

type AuthHandler struct {
	service authservice.AuthService
}

func NewAuthHandler(service authservice.AuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Email    string `json:"email" validate:"required,email"`
		Username string `json:"username"  validate:"required,min=3,max=32"`
		Password string `json:"password" validate:"required,min=8"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	if err := h.service.Register(r.Context(), requestBody.Email, requestBody.Username, requestBody.Password); err != nil {
		switch {
		case errors.Is(err, authservice.UsernameAlreadyExists):
			handler.ErrorCodeResponse(w, http.StatusConflict, "Username already exists", "USERNAME_TAKEN")
			return

		case errors.Is(err, authservice.EmailAlreadyExists):
			handler.ErrorCodeResponse(w, http.StatusConflict, "Email already exists", "EMAIL_TAKEN")
			return

		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to create user", err)
			return
		}
	}

	successPayload := map[string]string{"message": "User created successfully. You can log in now."}
	handler.SuccessResponse(w, http.StatusCreated, successPayload)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Identifier string `json:"identifier" validate:"required,min=3"`
		Password   string `json:"password" validate:"required,min=8"`
	}

	if !helper.ValidateRequest(w, r, &requestBody) {
		return
	}

	token, expirationTime, err := h.service.Login(r.Context(), requestBody.Identifier, requestBody.Password)
	if err != nil {
		switch {
		case errors.Is(err, authservice.InvalidCredentials):
			handler.ErrorCodeResponse(w, http.StatusUnauthorized, "Invalid username or password", "INVALID_CREDENTIALS")
			return

		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Login failed", err)
			return
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:     JWT_TOKEN_KEY,
		Value:    token,
		Expires:  expirationTime,
		HttpOnly: true,
		Path:     "/",
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	responsePayload := map[string]string{"message": "Login successful"}
	handler.SuccessResponse(w, http.StatusOK, responsePayload)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     JWT_TOKEN_KEY,
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	handler.SuccessResponse(w, http.StatusNoContent, nil)
}

func (h *AuthHandler) GetWSTicket(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*jwt.RegisteredClaims)
	if !ok {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve user claims", nil)
		return
	}

	userID, err := strconv.Atoi(claims.Subject)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Invalid user ID in token", err)
		return
	}

	ticket, err := h.service.GenerateWSTicket(r.Context(), userID)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to generate ticket", err)
		return
	}

	handler.SuccessResponse(w, http.StatusOK, map[string]string{"ticket": ticket})
}
