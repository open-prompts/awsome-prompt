package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/data"
	"awsome-prompt/backend/internal/repository"
	"awsome-prompt/backend/internal/service"

	"google.golang.org/grpc"
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

	// gRPC Server
	go func() {
		lis, err := net.Listen("tcp", ":50051")
		if err != nil {
			log.Fatalf("failed to listen: %v", err)
		}
		s := grpc.NewServer()
		pb.RegisterPromptServiceServer(s, svc)
		log.Printf("gRPC server listening at %v", lis.Addr())
		if err := s.Serve(lis); err != nil {
			log.Fatalf("failed to serve: %v", err)
		}
	}()

	// HTTP Server for FVT/REST
	http.HandleFunc("/api/v1/templates", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			return
		}

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse query params
		req := &pb.ListTemplatesRequest{}
		// For simplicity in this demo, we are not parsing all query params
		// In a real app, we would parse page_size, page_token, etc.

		resp, err := svc.ListTemplates(context.Background(), req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	log.Println("HTTP server listening at :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("failed to serve http: %v", err)
	}
}
