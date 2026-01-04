package main

import (
	"log"
	"net"

	"google.golang.org/grpc"
	// "awsome-prompt/backend/internal/service"
	// pb "awsome-prompt/backend/api/proto/v1"
)

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()

	// Register services here
	// pb.RegisterPromptServiceServer(s, &service.PromptService{})

	log.Printf("server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
