package main

import (
	"context"
	"database/sql"
	"errors"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	server "github.com/nikitinvitya/messenger"
	"github.com/nikitinvitya/messenger/internal/handler"
	"github.com/nikitinvitya/messenger/internal/handler/authhandler"
	"github.com/nikitinvitya/messenger/internal/handler/userhandler"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
	"github.com/nikitinvitya/messenger/internal/service/authservice"
	"github.com/nikitinvitya/messenger/internal/service/userservice"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	if err := godotenv.Load(); err != nil {
		slog.Warn(".env file not found, using environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("FATAL: DATABASE_URL is not set")
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("FATAL: JWT_SECRET is not set")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("Connecting to database...")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("FATAL: Failed to open db connection: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("FATAL: Failed to ping database: %v", err)
	}
	slog.Info("Successfully connected to the database!")

	userRepo := userrepository.NewUserRepository(db)
	authService := authservice.NewAuthService(userRepo, jwtSecret)
	authHandler := authhandler.NewAuthHandler(authService)
	userService := userservice.NewUserService(userRepo)
	userHandler := userhandler.NewUserHandler(userService)

	apiHandlersDeps := handler.APIHandlersDeps{
		Auth:      authHandler,
		User:      userHandler,
		JwtSecret: jwtSecret,
	}

	apiHandlers := handler.NewAPIHandlers(apiHandlersDeps)
	router := apiHandlers.InitRoutes()

	srv := &server.Server{}

	go func() {
		slog.Info("Starting server", "port", port)
		if err := srv.Run(":"+port, router); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("FATAL: error occurred while running http server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("FATAL: Server forced to shutdown: %v", err)
	}

	slog.Info("Server exiting")
}
