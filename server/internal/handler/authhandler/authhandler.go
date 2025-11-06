package authhandler

import (
	"errors"
	"github.com/nikitinvitya/messenger/internal/handler/helper"
	"github.com/nikitinvitya/messenger/internal/handler/response"
	"github.com/nikitinvitya/messenger/internal/service/authservice"
	"net/http"
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
			handler.ClientErrorResponse(w, http.StatusConflict, "Username already exists")
		case errors.Is(err, authservice.EmailAlreadyExists):
			handler.ClientErrorResponse(w, http.StatusConflict, "Email already exists")
		default:
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to create user", err)
		}
		return
	}

	successPayload := map[string]string{"message": "User created successfully"}
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

	token, err := h.service.Login(r.Context(), requestBody.Identifier, requestBody.Password)
	if err != nil {
		if errors.Is(err, authservice.InvalidCredentials) {
			handler.ClientErrorResponse(w, http.StatusUnauthorized, "Invalid credentials")
		} else {
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Login failed", err)
		}
		return
	}

	tokenPayload := map[string]string{"token": token}
	handler.SuccessResponse(w, http.StatusOK, tokenPayload)
}
