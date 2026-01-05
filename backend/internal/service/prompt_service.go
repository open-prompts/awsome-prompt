package service

import (
	"context"
	"database/sql"
	"strconv"
	"time"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/models"
	"awsome-prompt/backend/internal/repository"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// PromptService implements the PromptServiceServer interface.
type PromptService struct {
	pb.UnimplementedPromptServiceServer
	repo repository.TemplateRepository
}

// NewPromptService creates a new instance of PromptService.
func NewPromptService(repo repository.TemplateRepository) *PromptService {
	return &PromptService{repo: repo}
}

// CreateTemplate creates a new prompt template.
func (s *PromptService) CreateTemplate(ctx context.Context, req *pb.CreateTemplateRequest) (*pb.CreateTemplateResponse, error) {
	t := &models.Template{
		OwnerID:     req.OwnerId,
		Title:       req.Title,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
		Visibility:  mapVisibilityToModel(req.Visibility),
		Type:        mapTypeToModel(req.Type),
		Tags:        req.Tags,
		Category:    sql.NullString{String: req.Category, Valid: req.Category != ""},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.repo.Create(ctx, t); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create template: %v", err)
	}

	return &pb.CreateTemplateResponse{
		Template: mapModelToProto(t),
	}, nil
}

// UpdateTemplate updates an existing template.
func (s *PromptService) UpdateTemplate(ctx context.Context, req *pb.UpdateTemplateRequest) (*pb.UpdateTemplateResponse, error) {
	t, err := s.repo.Get(ctx, req.TemplateId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "template not found: %v", err)
	}

	// Authorization check (simple version)
	if t.OwnerID != req.OwnerId {
		return nil, status.Errorf(codes.PermissionDenied, "not authorized to update this template")
	}

	t.Title = req.Title
	t.Description = sql.NullString{String: req.Description, Valid: req.Description != ""}
	t.Visibility = mapVisibilityToModel(req.Visibility)
	t.Tags = req.Tags
	t.Category = sql.NullString{String: req.Category, Valid: req.Category != ""}
	t.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, t); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update template: %v", err)
	}

	return &pb.UpdateTemplateResponse{
		Template: mapModelToProto(t),
	}, nil
}

// DeleteTemplate deletes a template.
func (s *PromptService) DeleteTemplate(ctx context.Context, req *pb.DeleteTemplateRequest) (*pb.DeleteTemplateResponse, error) {
	t, err := s.repo.Get(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "template not found: %v", err)
	}

	if t.OwnerID != req.OwnerId {
		return nil, status.Errorf(codes.PermissionDenied, "not authorized to delete this template")
	}

	if err := s.repo.Delete(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete template: %v", err)
	}

	return &pb.DeleteTemplateResponse{Success: true}, nil
}

// GetTemplate retrieves a template by ID.
func (s *PromptService) GetTemplate(ctx context.Context, req *pb.GetTemplateRequest) (*pb.GetTemplateResponse, error) {
	t, err := s.repo.Get(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "template not found: %v", err)
	}

	return &pb.GetTemplateResponse{
		Template: mapModelToProto(t),
	}, nil
}

// ListTemplates lists templates with optional filtering.
func (s *PromptService) ListTemplates(ctx context.Context, req *pb.ListTemplatesRequest) (*pb.ListTemplatesResponse, error) {
	limit := int(req.PageSize)
	if limit <= 0 {
		limit = 10
	}
	offset := 0
	if req.PageToken != "" {
		var err error
		offset, err = strconv.Atoi(req.PageToken)
		if err != nil {
			// Handle invalid token, maybe default to 0 or return error
			offset = 0
		}
	}

	filters := make(map[string]interface{})
	switch req.Visibility {
	case pb.Visibility_VISIBILITY_PUBLIC:
		filters["visibility"] = "public"
	case pb.Visibility_VISIBILITY_PRIVATE:
		filters["visibility"] = "private"
	}
	if req.OwnerId != "" {
		filters["owner_id"] = req.OwnerId
	}
	if req.Category != "" {
		filters["category"] = req.Category
	}
	if len(req.Tags) > 0 {
		filters["tags"] = req.Tags
	}

	templates, err := s.repo.List(ctx, limit, offset, filters)
	if err != nil {
		return nil, err
	}

	var pbTemplates []*pb.Template
	for _, t := range templates {
		pbTemplates = append(pbTemplates, mapModelToProto(t))
	}

	nextPageToken := ""
	if len(templates) == limit {
		nextPageToken = strconv.Itoa(offset + limit)
	}

	return &pb.ListTemplatesResponse{
		Templates:     pbTemplates,
		NextPageToken: nextPageToken,
	}, nil
}

func mapModelToProto(t *models.Template) *pb.Template {
	return &pb.Template{
		Id:          t.ID,
		OwnerId:     t.OwnerID,
		Title:       t.Title,
		Description: t.Description.String,
		Visibility:  mapVisibility(t.Visibility),
		Type:        mapType(t.Type),
		Tags:        t.Tags,
		Category:    t.Category.String,
		LikedBy:     t.LikedBy,
		FavoritedBy: t.FavoritedBy,
		CreatedAt:   timestamppb.New(t.CreatedAt),
		UpdatedAt:   timestamppb.New(t.UpdatedAt),
	}
}

func mapVisibilityToModel(v pb.Visibility) string {
	switch v {
	case pb.Visibility_VISIBILITY_PUBLIC:
		return "public"
	case pb.Visibility_VISIBILITY_PRIVATE:
		return "private"
	default:
		return "private"
	}
}

func mapTypeToModel(t pb.TemplateType) string {
	switch t {
	case pb.TemplateType_TEMPLATE_TYPE_SYSTEM:
		return "system"
	case pb.TemplateType_TEMPLATE_TYPE_USER:
		return "user"
	default:
		return "user"
	}
}

func mapVisibility(v string) pb.Visibility {
	switch v {
	case "public":
		return pb.Visibility_VISIBILITY_PUBLIC
	case "private":
		return pb.Visibility_VISIBILITY_PRIVATE
	default:
		return pb.Visibility_VISIBILITY_UNSPECIFIED
	}
}

func mapType(t string) pb.TemplateType {
	switch t {
	case "system":
		return pb.TemplateType_TEMPLATE_TYPE_SYSTEM
	case "user":
		return pb.TemplateType_TEMPLATE_TYPE_USER
	default:
		return pb.TemplateType_TEMPLATE_TYPE_UNSPECIFIED
	}
}
