package helper

import (
	"encoding/json"
	"errors"
	"github.com/go-playground/validator/v10"
	handler "github.com/nikitinvitya/messenger/internal/handler/response"
	"net/http"
)

var validate = validator.New()

func ValidateRequest(w http.ResponseWriter, r *http.Request, body interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(body); err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return false
	}

	if err := validate.Struct(body); err != nil {
		var validationErrors validator.ValidationErrors
		if errors.As(err, &validationErrors) {
			errorResponse := make(map[string]string)
			for _, fieldError := range validationErrors {
				errorResponse[fieldError.Field()] = fieldError.Error()
			}
			handler.ValidationErrorResponse(w, http.StatusBadRequest, errorResponse)
		} else {
			handler.ServerErrorResponse(w, http.StatusInternalServerError, "Error validating request", err)
		}
		return false
	}

	return true
}
