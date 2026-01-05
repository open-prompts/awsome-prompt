package service

import (
	"context"
	"testing"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/models"
	"awsome-prompt/backend/internal/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

// MockUserRepository is a mock implementation of repository.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Insert(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func TestRegister(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		mockRepo := new(MockUserRepository)
		svc := NewUserService(mockRepo, "secret")
		req := &pb.RegisterRequest{
			Id:          "user_123",
			Email:       "test@example.com",
			Password:    "password123",
			DisplayName: "Test User",
		}

		mockRepo.On("GetByID", mock.Anything, req.Id).Return(nil, repository.ErrUserNotFound)
		mockRepo.On("GetByEmail", mock.Anything, req.Email).Return(nil, repository.ErrUserNotFound)
		mockRepo.On("Insert", mock.Anything, mock.MatchedBy(func(u *models.User) bool {
			return u.ID == req.Id && u.Email == req.Email && u.DisplayName == req.DisplayName
		})).Return(nil)

		resp, err := svc.Register(context.Background(), req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, req.Id, resp.Id)
		assert.NotEmpty(t, resp.Token)
		mockRepo.AssertExpectations(t)
	})

	t.Run("DuplicateID", func(t *testing.T) {
		mockRepo := new(MockUserRepository)
		svc := NewUserService(mockRepo, "secret")
		req := &pb.RegisterRequest{
			Id:       "user_123",
			Email:    "test@example.com",
			Password: "password123",
		}

		mockRepo.On("GetByID", mock.Anything, req.Id).Return(&models.User{}, nil)

		resp, err := svc.Register(context.Background(), req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "id already exists")
	})

	t.Run("InvalidID", func(t *testing.T) {
		mockRepo := new(MockUserRepository)
		svc := NewUserService(mockRepo, "secret")
		req := &pb.RegisterRequest{
			Id:       "user-123", // Invalid character '-'
			Email:    "test@example.com",
			Password: "password123",
		}

		resp, err := svc.Register(context.Background(), req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "alphanumeric characters and underscores")
	})
}

func TestLogin(t *testing.T) {
	password := "password123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := &models.User{
		ID:           "user_123",
		Email:        "test@example.com",
		PasswordHash: string(hash),
		DisplayName:  "Test User",
	}

	t.Run("SuccessByEmail", func(t *testing.T) {
		mockRepo := new(MockUserRepository)
		svc := NewUserService(mockRepo, "secret")
		req := &pb.LoginRequest{
			Email:    "test@example.com",
			Password: password,
		}

		mockRepo.On("GetByEmail", mock.Anything, req.Email).Return(user, nil)

		resp, err := svc.Login(context.Background(), req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, user.ID, resp.Id)
		assert.NotEmpty(t, resp.Token)
	})

	t.Run("SuccessByID", func(t *testing.T) {
		mockRepo := new(MockUserRepository)
		svc := NewUserService(mockRepo, "secret")
		req := &pb.LoginRequest{
			Email:    "user_123", // Using ID in Email field as identifier
			Password: password,
		}

		mockRepo.On("GetByEmail", mock.Anything, req.Email).Return(nil, repository.ErrUserNotFound)
		mockRepo.On("GetByID", mock.Anything, req.Email).Return(user, nil)

		resp, err := svc.Login(context.Background(), req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, user.ID, resp.Id)
	})

	t.Run("InvalidPassword", func(t *testing.T) {
		mockRepo := new(MockUserRepository)
		svc := NewUserService(mockRepo, "secret")
		req := &pb.LoginRequest{
			Email:    "test@example.com",
			Password: "wrongpassword",
		}

		mockRepo.On("GetByEmail", mock.Anything, req.Email).Return(user, nil)

		resp, err := svc.Login(context.Background(), req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "invalid credentials")
	})

	t.Run("UserNotFound", func(t *testing.T) {
		mockRepo := new(MockUserRepository)
		svc := NewUserService(mockRepo, "secret")
		req := &pb.LoginRequest{
			Email:    "unknown@example.com",
			Password: "password",
		}

		mockRepo.On("GetByEmail", mock.Anything, req.Email).Return(nil, repository.ErrUserNotFound)
		mockRepo.On("GetByID", mock.Anything, req.Email).Return(nil, repository.ErrUserNotFound)

		resp, err := svc.Login(context.Background(), req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "invalid credentials")
	})
}
