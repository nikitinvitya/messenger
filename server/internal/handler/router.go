package handler

import (
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/nikitinvitya/messenger/internal/handler/authhandler"
	"github.com/nikitinvitya/messenger/internal/handler/middleware"
	"github.com/nikitinvitya/messenger/internal/handler/userhandler"
	"net/http"
	"os"
)

type APIHandlersDeps struct {
	Auth      *authhandler.AuthHandler
	User      *userhandler.UserHandler
	JwtSecret string
}

type APIHandlers struct {
	Auth      *authhandler.AuthHandler
	User      *userhandler.UserHandler
	jwtSecret string
}

func NewAPIHandlers(deps APIHandlersDeps) *APIHandlers {
	return &APIHandlers{
		Auth:      deps.Auth,
		User:      deps.User,
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

	router.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", h.Auth.Register)
			r.Post("/login", h.Auth.Login)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(h.jwtSecret))
			r.Route("/users", func(r chi.Router) {
				r.Get("/me", h.User.GetMyProfile)
			})
		})
	})

	return router
}
