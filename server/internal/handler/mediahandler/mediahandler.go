package mediahandler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/nikitinvitya/messenger/internal/handler/response"
)

type MediaHandler struct {
	uploadDir string
}

func NewMediaHandler(uploadDir string) *MediaHandler {
	return &MediaHandler{
		uploadDir: uploadDir,
	}
}

const maxFileSize = 10 * 1024 * 1024

func (h *MediaHandler) Upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxFileSize)
	if err := r.ParseMultipartForm(maxFileSize); err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "File too large (max 10MB)")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Failed to get file from request")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	validExtensions := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !validExtensions[ext] {
		handler.ClientErrorResponse(w, http.StatusBadRequest, "Invalid file type. Only images are allowed")
		return
	}

	newFileName := fmt.Sprintf("%d-%s%s", time.Now().Unix(), uuid.New().String(), ext)
	dstPath := filepath.Join(h.uploadDir, newFileName)

	dst, err := os.Create(dstPath)
	if err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to save file on server", err)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		handler.ServerErrorResponse(w, http.StatusInternalServerError, "Failed to write file", err)
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s", newFileName)
	handler.SuccessResponse(w, http.StatusCreated, map[string]string{"url": fileURL})
}
