package service

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mocks
type MockPromptRepository struct {
	mock.Mock
}

func (m *MockPromptRepository) Create(ctx context.Context, prompt *models.Prompt) error {
	args := m.Called(ctx, prompt)
	return args.Error(0)
}

func (m *MockPromptRepository) Get(ctx context.Context, id string) (*models.Prompt, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Prompt), args.Error(1)
}

func (m *MockPromptRepository) List(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*models.Prompt, error) {
	args := m.Called(ctx, limit, offset, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Prompt), args.Error(1)
}

func (m *MockPromptRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockTemplateRepository (minimal for Prompt tests)
type MockTemplateRepository struct {
	mock.Mock
}

func (m *MockTemplateRepository) Create(ctx context.Context, t *models.Template) error { return nil }
func (m *MockTemplateRepository) Get(ctx context.Context, id string) (*models.Template, error) {
	return nil, nil
}
func (m *MockTemplateRepository) List(ctx context.Context, l, o int, f map[string]interface{}) ([]*models.Template, error) {
	return nil, nil
}
func (m *MockTemplateRepository) Update(ctx context.Context, t *models.Template) error { return nil }
func (m *MockTemplateRepository) Delete(ctx context.Context, id string) error          { return nil }
func (m *MockTemplateRepository) ListCategories(ctx context.Context, filters map[string]interface{}) ([]*models.CategoryStat, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.CategoryStat), args.Error(1)
}
func (m *MockTemplateRepository) ListTags(ctx context.Context, filters map[string]interface{}) ([]*models.TagStat, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.TagStat), args.Error(1)
}

// MockTemplateVersionRepository
type MockTemplateVersionRepository struct {
	mock.Mock
}

func (m *MockTemplateVersionRepository) Create(ctx context.Context, v *models.TemplateVersion) error {
	return nil
}
func (m *MockTemplateVersionRepository) GetLatest(ctx context.Context, tid string) (*models.TemplateVersion, error) {
	return nil, nil
}
func (m *MockTemplateVersionRepository) List(ctx context.Context, limit, offset int, templateID string) ([]*models.TemplateVersion, error) {
	args := m.Called(ctx, limit, offset, templateID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.TemplateVersion), args.Error(1)
}

func TestCreatePrompt(t *testing.T) {
	mockPromptRepo := new(MockPromptRepository)
	mockTemplateRepo := new(MockTemplateRepository)
	mockVersionRepo := new(MockTemplateVersionRepository)

	svc := NewPromptService(mockPromptRepo, mockTemplateRepo, mockVersionRepo)

	t.Run("Success", func(t *testing.T) {
		req := &pb.CreatePromptRequest{
			TemplateId: "tpl_1",
			VersionId:  1,
			OwnerId:    "user_1",
			Variables:  []string{"var1"},
		}

		mockPromptRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Prompt")).Return(nil)

		resp, err := svc.CreatePrompt(context.Background(), req)
		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, req.OwnerId, resp.Prompt.OwnerId)

		mockPromptRepo.AssertExpectations(t)
	})
}

func TestGetPrompt(t *testing.T) {
	mockPromptRepo := new(MockPromptRepository)
	mockTemplateRepo := new(MockTemplateRepository)
	mockVersionRepo := new(MockTemplateVersionRepository)

	svc := NewPromptService(mockPromptRepo, mockTemplateRepo, mockVersionRepo)

	t.Run("Success", func(t *testing.T) {
		vars, _ := json.Marshal([]string{"v1"})
		prompt := &models.Prompt{
			ID:        "p_1",
			OwnerID:   "user_1",
			Variables: vars,
			CreatedAt: time.Now(),
		}

		mockPromptRepo.On("Get", mock.Anything, "p_1").Return(prompt, nil)

		resp, err := svc.GetPrompt(context.Background(), &pb.GetPromptRequest{Id: "p_1"})
		assert.NoError(t, err)
		assert.Equal(t, "p_1", resp.Prompt.Id)
	})
}

func TestDeletePrompt(t *testing.T) {
	mockPromptRepo := new(MockPromptRepository)
	mockTemplateRepo := new(MockTemplateRepository)
	mockVersionRepo := new(MockTemplateVersionRepository)

	svc := NewPromptService(mockPromptRepo, mockTemplateRepo, mockVersionRepo)

	t.Run("Success", func(t *testing.T) {
		prompt := &models.Prompt{ID: "p_1", OwnerID: "user_1"}
		mockPromptRepo.On("Get", mock.Anything, "p_1").Return(prompt, nil)
		mockPromptRepo.On("Delete", mock.Anything, "p_1").Return(nil)

		resp, err := svc.DeletePrompt(context.Background(), &pb.DeletePromptRequest{Id: "p_1", OwnerId: "user_1"})
		assert.NoError(t, err)
		assert.True(t, resp.Success)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		prompt := &models.Prompt{ID: "p_1", OwnerID: "user_1"}
		mockPromptRepo.On("Get", mock.Anything, "p_1").Return(prompt, nil)

		_, err := svc.DeletePrompt(context.Background(), &pb.DeletePromptRequest{Id: "p_1", OwnerId: "user_2"})
		assert.Error(t, err)
	})
}

func TestListCategories(t *testing.T) {
	mockPromptRepo := new(MockPromptRepository)
	mockTemplateRepo := new(MockTemplateRepository)
	mockVersionRepo := new(MockTemplateVersionRepository)

	svc := NewPromptService(mockPromptRepo, mockTemplateRepo, mockVersionRepo)

	t.Run("Success", func(t *testing.T) {
		stats := []*models.CategoryStat{
			{Name: "cat1", Count: 10},
			{Name: "cat2", Count: 5},
		}
		mockTemplateRepo.On("ListCategories", mock.Anything, mock.Anything).Return(stats, nil)

		resp, err := svc.ListCategories(context.Background(), &pb.ListCategoriesRequest{})
		assert.NoError(t, err)
		assert.Len(t, resp.Categories, 2)
		assert.Equal(t, "cat1", resp.Categories[0].Name)
		assert.Equal(t, int32(10), resp.Categories[0].Count)
	})
}

func TestListTags(t *testing.T) {
	mockPromptRepo := new(MockPromptRepository)
	mockTemplateRepo := new(MockTemplateRepository)
	mockVersionRepo := new(MockTemplateVersionRepository)

	svc := NewPromptService(mockPromptRepo, mockTemplateRepo, mockVersionRepo)

	t.Run("Success", func(t *testing.T) {
		stats := []*models.TagStat{
			{Name: "tag1", Count: 20},
			{Name: "tag2", Count: 15},
		}
		mockTemplateRepo.On("ListTags", mock.Anything, mock.Anything).Return(stats, nil)

		resp, err := svc.ListTags(context.Background(), &pb.ListTagsRequest{})
		assert.NoError(t, err)
		assert.Len(t, resp.Tags, 2)
		assert.Equal(t, "tag1", resp.Tags[0].Name)
		assert.Equal(t, int32(20), resp.Tags[0].Count)
	})
}
