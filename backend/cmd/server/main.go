package main

import (
	"context"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strings"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/data"
	"awsome-prompt/backend/internal/repository"
	"awsome-prompt/backend/internal/service"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/encoding/protojson"
)

func main() {
	// Database connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/awsome_prompt?sslmode=disable"
	}
	pgConn, err := data.NewPostgresConnection(dsn)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Repository and Service
	repo := repository.NewTemplateRepository(pgConn.DB)
	svc := service.NewPromptService(repo)

	// User Service
	userRepo := repository.NewUserRepository(pgConn.DB)
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default-secret-key-change-me"
	}
	userSvc := service.NewUserService(userRepo, jwtSecret)

	// gRPC Server
	go func() {
		lis, err := net.Listen("tcp", ":50051")
		if err != nil {
			log.Fatalf("failed to listen: %v", err)
		}
		s := grpc.NewServer()
		pb.RegisterPromptServiceServer(s, svc)
		pb.RegisterUserServiceServer(s, userSvc)
		log.Printf("gRPC server listening at %v", lis.Addr())
		if err := s.Serve(lis); err != nil {
			log.Fatalf("failed to serve: %v", err)
		}
	}()

	// Helper for JSON marshaling
	marshaler := protojson.MarshalOptions{
		EmitUnpopulated: true,
		UseProtoNames:   true,
	}
	unmarshaler := protojson.UnmarshalOptions{
		DiscardUnknown: true,
	}

	// HTTP Server for FVT/REST
	http.HandleFunc("/api/v1/templates", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			return
		}

		switch r.Method {
		case http.MethodGet:
			req := &pb.ListTemplatesRequest{}
			resp, err := svc.ListTemplates(context.Background(), req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			b, _ := marshaler.Marshal(resp)
			_, _ = w.Write(b)

		case http.MethodPost:
			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, "Failed to read body", http.StatusBadRequest)
				return
			}
			var req pb.CreateTemplateRequest
			if err := unmarshaler.Unmarshal(body, &req); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			resp, err := svc.CreateTemplate(context.Background(), &req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			b, _ := marshaler.Marshal(resp)
			_, _ = w.Write(b)

		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/v1/templates/", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			return
		}

		id := strings.TrimPrefix(r.URL.Path, "/api/v1/templates/")
		if id == "" {
			http.Error(w, "ID required", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodGet:
			req := &pb.GetTemplateRequest{Id: id}
			resp, err := svc.GetTemplate(context.Background(), req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			b, _ := marshaler.Marshal(resp)
			_, _ = w.Write(b)

		case http.MethodPut:
			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, "Failed to read body", http.StatusBadRequest)
				return
			}
			var req pb.UpdateTemplateRequest
			if err := unmarshaler.Unmarshal(body, &req); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			req.TemplateId = id
			resp, err := svc.UpdateTemplate(context.Background(), &req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			b, _ := marshaler.Marshal(resp)
			_, _ = w.Write(b)

		case http.MethodDelete:
			ownerID := r.URL.Query().Get("owner_id")
			req := &pb.DeleteTemplateRequest{Id: id, OwnerId: ownerID}
			resp, err := svc.DeleteTemplate(context.Background(), req)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			b, _ := marshaler.Marshal(resp)
			_, _ = w.Write(b)

		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// User Handlers
	http.HandleFunc("/api/v1/register", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read body", http.StatusBadRequest)
			return
		}
		var req pb.RegisterRequest
		if err := unmarshaler.Unmarshal(body, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		resp, err := userSvc.Register(context.Background(), &req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		b, _ := marshaler.Marshal(resp)
		_, _ = w.Write(b)
	})

	http.HandleFunc("/api/v1/login", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read body", http.StatusBadRequest)
			return
		}
		var req pb.LoginRequest
		if err := unmarshaler.Unmarshal(body, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		resp, err := userSvc.Login(context.Background(), &req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		b, _ := marshaler.Marshal(resp)
		_, _ = w.Write(b)
	})

	log.Println("HTTP server listening at :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("failed to serve http: %v", err)
	}
}
