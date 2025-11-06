package authhandler

import (
	"encoding/json"
	"errors"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/authservice"
	"net/http"
)

var (
	InvalidCredentials = "Invalid credentials"
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
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, InvalidCredentials)
		return
	}

	if err := h.service.Register(r.Context(), requestBody.Email, requestBody.Username, requestBody.Password); err != nil {
		switch {
		case errors.Is(err, authservice.UsernameAlreadyExists):
			handler.ClientErrorResponse(w, http.StatusConflict, "Username already exists")
		case errors.Is(err, authservice.EmailAlreadyExists):
			handler.ClientErrorResponse(w, http.StatusConflict, "Email already exists")
		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to create user", err)
		}
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		Identifier string `json:"identifier"`
		Password   string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, InvalidCredentials)
		return
	}

	token, err := h.service.Login(r.Context(), requestBody.Identifier, requestBody.Password)
	if err != nil {
		if errors.Is(err, authservice.InvalidCredentials) {
			handler.ClientErrorResponse(w, http.StatusUnauthorized, "Invalid credentials")
		} else {
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Login failed", err)
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}
