package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	server "github.com/nikitinvitya/messenger"
	"github.com/nikitinvitya/messenger/internal/handler"
	"github.com/nikitinvitya/messenger/internal/handler/authhandler"
	"github.com/nikitinvitya/messenger/internal/handler/blocklisthandler"
	"github.com/nikitinvitya/messenger/internal/handler/chathandler"
	"github.com/nikitinvitya/messenger/internal/handler/mediahandler"
	"github.com/nikitinvitya/messenger/internal/handler/messagehandler"
	"github.com/nikitinvitya/messenger/internal/handler/userhandler"
	"github.com/nikitinvitya/messenger/internal/handler/websockethandler"
	"github.com/nikitinvitya/messenger/internal/repository/blocklistrepository"
	"github.com/nikitinvitya/messenger/internal/repository/chatrepository"
	"github.com/nikitinvitya/messenger/internal/repository/messagerepository"
	"github.com/nikitinvitya/messenger/internal/repository/userrepository"
	"github.com/nikitinvitya/messenger/internal/service/authservice"
	"github.com/nikitinvitya/messenger/internal/service/blocklistservice"
	"github.com/nikitinvitya/messenger/internal/service/chatservice"
	"github.com/nikitinvitya/messenger/internal/service/messageservice"
	"github.com/nikitinvitya/messenger/internal/service/userservice"
	"github.com/nikitinvitya/messenger/internal/websocket"
	"github.com/nikitinvitya/messenger/pkg/email"
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

	uploadDir := "./uploads"

	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		_ = os.Mkdir(uploadDir, os.ModePerm)
	}

	hub := websocket.NewHub()
	go hub.Run()
	slog.Info("Websocket Hub started")

	userRepo := userrepository.NewUserRepository(db)
	chatRepo := chatrepository.NewChatRepository(db)
	messageRepo := messagerepository.NewMessageRepository(db)
	blocklistRepo := blocklistrepository.NewBlocklistRepository(db)

	mailService := email.NewMailer()
	authService := authservice.NewAuthService(userRepo, jwtSecret, mailService)
	userService := userservice.NewUserService(userRepo, hub)
	chatService := chatservice.NewChatService(chatRepo, hub)
	blocklistService := blocklistservice.NewBlocklistService(blocklistRepo)
	messageService := messageservice.NewMessageService(chatRepo, messageRepo, userRepo, hub, blocklistService)

	authHandler := authhandler.NewAuthHandler(authService)
	userHandler := userhandler.NewUserHandler(userService)
	chatHandler := chathandler.NewChatHandler(chatService)
	messageHandler := messagehandler.NewMessageHandler(messageService)
	websocketHandler := websockethandler.NewWebsocketHandler(hub, chatService)
	blocklistHandler := blocklisthandler.NewBlocklistHandler(blocklistService)
	mediaHandler := mediahandler.NewMediaHandler(uploadDir)

	go websocketHandler.HandlePresence()
	apiHandlersDeps := handler.APIHandlersDeps{
		Auth:      authHandler,
		User:      userHandler,
		Chat:      chatHandler,
		Message:   messageHandler,
		Websocket: websocketHandler,
		Blocklist: blocklistHandler,
		JwtSecret: jwtSecret,
		Media:     mediaHandler,
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
