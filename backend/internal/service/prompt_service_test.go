package service

import (
	"context"
	"testing"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/models"
)

type MockRepository struct {
	ListFunc   func(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*models.Template, error)
	CreateFunc func(ctx context.Context, template *models.Template) error
	UpdateFunc func(ctx context.Context, template *models.Template) error
	DeleteFunc func(ctx context.Context, id string) error
	GetFunc    func(ctx context.Context, id string) (*models.Template, error)
}

func (m *MockRepository) List(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*models.Template, error) {
	return m.ListFunc(ctx, limit, offset, filters)
}

func (m *MockRepository) Create(ctx context.Context, template *models.Template) error {
	return m.CreateFunc(ctx, template)
}

func (m *MockRepository) Update(ctx context.Context, template *models.Template) error {
	return m.UpdateFunc(ctx, template)
}

func (m *MockRepository) Delete(ctx context.Context, id string) error {
	return m.DeleteFunc(ctx, id)
}

func (m *MockRepository) Get(ctx context.Context, id string) (*models.Template, error) {
	return m.GetFunc(ctx, id)
}

func TestListTemplates(t *testing.T) {
	mockRepo := &MockRepository{
		ListFunc: func(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*models.Template, error) {
			return []*models.Template{
				{ID: "1", Title: "Test Template"},
			}, nil
		},
	}
	svc := NewPromptService(mockRepo)

	req := &pb.ListTemplatesRequest{PageSize: 10}
	resp, err := svc.ListTemplates(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(resp.Templates) != 1 {
		t.Fatalf("expected 1 template, got %d", len(resp.Templates))
	}
	if resp.Templates[0].Title != "Test Template" {
		t.Errorf("expected title 'Test Template', got '%s'", resp.Templates[0].Title)
	}
}

func TestCreateTemplate(t *testing.T) {
	mockRepo := &MockRepository{
		CreateFunc: func(ctx context.Context, template *models.Template) error {
			template.ID = "new-id"
			return nil
		},
	}
	svc := NewPromptService(mockRepo)

	req := &pb.CreateTemplateRequest{
		OwnerId: "user1",
		Title:   "New Template",
	}
	resp, err := svc.CreateTemplate(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Template.Id != "new-id" {
		t.Errorf("expected ID 'new-id', got '%s'", resp.Template.Id)
	}
	if resp.Template.Title != "New Template" {
		t.Errorf("expected title 'New Template', got '%s'", resp.Template.Title)
	}
}

func TestUpdateTemplate(t *testing.T) {
	mockRepo := &MockRepository{
		GetFunc: func(ctx context.Context, id string) (*models.Template, error) {
			return &models.Template{ID: id, OwnerID: "user1", Title: "Old Title"}, nil
		},
		UpdateFunc: func(ctx context.Context, template *models.Template) error {
			return nil
		},
	}
	svc := NewPromptService(mockRepo)

	req := &pb.UpdateTemplateRequest{
		TemplateId: "1",
		OwnerId:    "user1",
		Title:      "Updated Title",
	}
	resp, err := svc.UpdateTemplate(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Template.Title != "Updated Title" {
		t.Errorf("expected title 'Updated Title', got '%s'", resp.Template.Title)
	}
}

func TestDeleteTemplate(t *testing.T) {
	mockRepo := &MockRepository{
		GetFunc: func(ctx context.Context, id string) (*models.Template, error) {
			return &models.Template{ID: id, OwnerID: "user1"}, nil
		},
		DeleteFunc: func(ctx context.Context, id string) error {
			return nil
		},
	}
	svc := NewPromptService(mockRepo)

	req := &pb.DeleteTemplateRequest{
		Id:      "1",
		OwnerId: "user1",
	}
	resp, err := svc.DeleteTemplate(context.Background(), req)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !resp.Success {
		t.Errorf("expected success true, got false")
	}
}
