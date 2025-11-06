package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type errorResponse struct {
	Error string `json:"error"`
}

func ServerErrorResponse(w http.ResponseWriter, statusCode int, userMessage string, err error) {
	slog.Error(userMessage, "error", err)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	json.NewEncoder(w).Encode(errorResponse{Error: userMessage})
}

func ClientErrorResponse(w http.ResponseWriter, statusCode int, userMessage string) {
	slog.Warn(userMessage, "error")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	json.NewEncoder(w).Encode(errorResponse{Error: userMessage})
}

func SuccessResponse(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Error("failed to write success response", "error", err)
	}
}
