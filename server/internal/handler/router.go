package handler

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/nikitinvitya/messenger/internal/handler/authhandler"
	"github.com/nikitinvitya/messenger/internal/handler/blocklisthandler"
	"github.com/nikitinvitya/messenger/internal/handler/chathandler"
	"github.com/nikitinvitya/messenger/internal/handler/mediahandler"
	"github.com/nikitinvitya/messenger/internal/handler/messagehandler"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	"github.com/nikitinvitya/messenger/internal/handler/userhandler"
	"github.com/nikitinvitya/messenger/internal/handler/websockethandler"
)

type APIHandlersDeps struct {
	Auth      *authhandler.AuthHandler
	User      *userhandler.UserHandler
	Chat      *chathandler.ChatHandler
	Message   *messagehandler.MessageHandler
	Websocket *websockethandler.WebsocketHandler
	Blocklist *blocklisthandler.BlocklistHandler
	Media     *mediahandler.MediaHandler
	JwtSecret string
}

type APIHandlers struct {
	Auth      *authhandler.AuthHandler
	User      *userhandler.UserHandler
	Chat      *chathandler.ChatHandler
	Message   *messagehandler.MessageHandler
	Websocket *websockethandler.WebsocketHandler
	Blocklist *blocklisthandler.BlocklistHandler
	Media     *mediahandler.MediaHandler
	jwtSecret string
}

func NewAPIHandlers(deps APIHandlersDeps) *APIHandlers {
	return &APIHandlers{
		Auth:      deps.Auth,
		User:      deps.User,
		Chat:      deps.Chat,
		Message:   deps.Message,
		Websocket: deps.Websocket,
		Blocklist: deps.Blocklist,
		Media:     deps.Media,
		jwtSecret: deps.JwtSecret,
	}
}

func (h *APIHandlers) InitRoutes() http.Handler {
	router := chi.NewRouter()

	allowedOrigin := os.Getenv("ALLOWED_CORS_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{allowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	router.Use(chiMiddleware.Logger)
	router.Use(chiMiddleware.Recoverer)
	router.Use(chiMiddleware.RequestID)
	router.Use(chiMiddleware.RealIP)

	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "uploads"))
	router.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(filesDir)))

	router.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", h.Auth.Register)
			r.Post("/login", h.Auth.Login)
			r.Post("/logout", h.Auth.Logout)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(h.jwtSecret))
			r.Get("/auth/ws-ticket", h.Auth.GetWSTicket)

			r.Post("/media/upload", h.Media.Upload)

			r.Route("/users", func(r chi.Router) {
				r.Get("/me", h.User.GetMyProfile)
				r.Get("/search", h.User.SearchUsersByUsername)
				r.Get("/info/{username}", h.User.GetUserByUsername)
				r.Put("/me", h.User.UpdateProfile)
				r.Put("/me/password", h.User.ChangePassword)
			})

			r.Route("/chats", func(r chi.Router) {
				r.Post("/", h.Chat.CreateChat)
				r.Get("/", h.Chat.ListUserChats)
				r.Post("/{chatID}/participants", h.Chat.AddParticipant)
				r.Get("/{chatID}", h.Chat.GetChatByID)
				r.Get("/{chatID}/messages", h.Message.ListMessagesInChat)
				r.Post("/{chatID}/messages", h.Message.CreateMessage)
				r.Get("/{chatID}/info", h.Chat.GetChatInfo)
				r.Put("/{chatID}", h.Chat.UpdateChat)
				r.Delete("/leave/{chatID}", h.Chat.LeaveChat)
				r.Delete("/{chatID}/history", h.Chat.ClearChatHistory)
			})

			r.Route("/messages", func(r chi.Router) {
				r.Put("/{messageID}", h.Message.UpdateMessage)
				r.Delete("/{messageID}", h.Message.DeleteMessage)
				r.Post("/forward/{chatID}", h.Message.ForwardMessage)
			})

			r.Get("/ws/connect", h.Websocket.ServeWs)

			r.Route("/blocklist", func(r chi.Router) {
				r.Post("/{userID}", h.Blocklist.Block)
				r.Delete("/{userID}", h.Blocklist.Unblock)
			})
		})
	})

	return router
}
