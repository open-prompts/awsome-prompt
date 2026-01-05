package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/models"
	"awsome-prompt/backend/internal/repository"

	"regexp"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var idRegex = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)

type UserService struct {
	pb.UnimplementedUserServiceServer
	Repo      repository.UserRepository
	JWTSecret []byte
}

func NewUserService(repo repository.UserRepository, jwtSecret string) *UserService {
	return &UserService{
		Repo:      repo,
		JWTSecret: []byte(jwtSecret),
	}
}

func (s *UserService) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	// Validate input
	if req.Id == "" || req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "id, email, and password are required")
	}

	if !idRegex.MatchString(req.Id) {
		return nil, status.Error(codes.InvalidArgument, "id must contain only alphanumeric characters and underscores")
	}

	// Check if user exists
	_, err := s.Repo.GetByID(ctx, req.Id)
	if err == nil {
		return nil, status.Error(codes.AlreadyExists, "id already exists")
	} else if !errors.Is(err, repository.ErrUserNotFound) {
		return nil, status.Errorf(codes.Internal, "failed to check user existence: %v", err)
	}

	_, err = s.Repo.GetByEmail(ctx, req.Email)
	if err == nil {
		return nil, status.Error(codes.AlreadyExists, "email already exists")
	} else if !errors.Is(err, repository.ErrUserNotFound) {
		return nil, status.Errorf(codes.Internal, "failed to check email existence: %v", err)
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to hash password: %v", err)
	}

	// Create user
	user := &models.User{
		ID:           req.Id,
		Email:        req.Email,
		PasswordHash: string(hash),
		DisplayName:  req.DisplayName,
	}
	if req.Mobile != "" {
		user.Mobile = sql.NullString{String: req.Mobile, Valid: true}
	}

	if err := s.Repo.Insert(ctx, user); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	// Generate token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate token: %v", err)
	}

	return &pb.RegisterResponse{
		Id:    user.ID,
		Token: token,
	}, nil
}

func (s *UserService) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	// Validate input
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email/identifier and password are required")
	}

	var user *models.User
	var err error

	// Try to find by email first
	user, err = s.Repo.GetByEmail(ctx, req.Email)
	if errors.Is(err, repository.ErrUserNotFound) {
		// Try by ID
		user, err = s.Repo.GetByID(ctx, req.Email)
	}

	if errors.Is(err, repository.ErrUserNotFound) {
		return nil, status.Error(codes.Unauthenticated, "invalid credentials")
	} else if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	// Generate token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate token: %v", err)
	}

	return &pb.LoginResponse{
		Id:          user.ID,
		Token:       token,
		DisplayName: user.DisplayName,
	}, nil
}

func (s *UserService) generateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
		"iss": "awsome-prompt",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.JWTSecret)
}
