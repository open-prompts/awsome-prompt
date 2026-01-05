package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
	"time"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/models"
	"awsome-prompt/backend/internal/repository"

	"github.com/lib/pq"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type PromptService struct {
	pb.UnimplementedPromptServiceServer
	PromptRepo          repository.PromptRepository
	TemplateRepo        repository.TemplateRepository
	TemplateVersionRepo repository.TemplateVersionRepository
}

func NewPromptService(
	promptRepo repository.PromptRepository,
	templateRepo repository.TemplateRepository,
	templateVersionRepo repository.TemplateVersionRepository,
) *PromptService {
	return &PromptService{
		PromptRepo:          promptRepo,
		TemplateRepo:        templateRepo,
		TemplateVersionRepo: templateVersionRepo,
	}
}

// --- Template RPCs ---

func (s *PromptService) CreateTemplate(ctx context.Context, req *pb.CreateTemplateRequest) (*pb.CreateTemplateResponse, error) {
	if req.OwnerId == "" {
		return nil, status.Error(codes.InvalidArgument, "owner_id is required")
	}

	// Map Visibility
	visibility := "private"
	if req.Visibility == pb.Visibility_VISIBILITY_PUBLIC {
		visibility = "public"
	}

	// Map Type
	typeStr := "user"
	if req.Type == pb.TemplateType_TEMPLATE_TYPE_SYSTEM {
		typeStr = "system"
	}

	template := &models.Template{
		OwnerID:     req.OwnerId,
		Title:       req.Title,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
		Visibility:  visibility,
		Type:        typeStr,
		Tags:        pq.StringArray(req.Tags),
		Category:    sql.NullString{String: req.Category, Valid: req.Category != ""},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.TemplateRepo.Create(ctx, template); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create template: %v", err)
	}

	// Create Version 1
	version := &models.TemplateVersion{
		TemplateID: template.ID,
		Version:    1,
		Content:    req.Content,
		CreatedAt:  time.Now(),
	}

	if err := s.TemplateVersionRepo.Create(ctx, version); err != nil {
		// Cleanup template? For now, just fail.
		return nil, status.Errorf(codes.Internal, "failed to create template version: %v", err)
	}

	return &pb.CreateTemplateResponse{
		Template: s.templateModelToProto(template),
		Version:  s.versionModelToProto(version),
	}, nil
}

func (s *PromptService) UpdateTemplate(ctx context.Context, req *pb.UpdateTemplateRequest) (*pb.UpdateTemplateResponse, error) {
	// Get existing template
	template, err := s.TemplateRepo.Get(ctx, req.TemplateId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "template not found")
	}

	// AuthZ
	if req.OwnerId != "" && template.OwnerID != req.OwnerId {
		return nil, status.Errorf(codes.PermissionDenied, "not authorized")
	}

	// Update fields
	if req.Title != "" {
		template.Title = req.Title
	}
	if req.Description != "" {
		template.Description = sql.NullString{String: req.Description, Valid: true}
	}
	// ... handle other fields ...
	template.UpdatedAt = time.Now()

	if err := s.TemplateRepo.Update(ctx, template); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update template: %v", err)
	}

	// Create new version
	latest, err := s.TemplateVersionRepo.GetLatest(ctx, template.ID)
	newVersionNum := 1
	if err == nil && latest != nil {
		newVersionNum = int(latest.Version) + 1
	}

	newVersion := &models.TemplateVersion{
		TemplateID: template.ID,
		Version:    int32(newVersionNum),
		Content:    req.Content,
		CreatedAt:  time.Now(),
	}

	if err := s.TemplateVersionRepo.Create(ctx, newVersion); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create new version: %v", err)
	}

	return &pb.UpdateTemplateResponse{
		Template:   s.templateModelToProto(template),
		NewVersion: s.versionModelToProto(newVersion),
	}, nil
}

func (s *PromptService) GetTemplate(ctx context.Context, req *pb.GetTemplateRequest) (*pb.GetTemplateResponse, error) {
	template, err := s.TemplateRepo.Get(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "template not found")
	}

	latest, _ := s.TemplateVersionRepo.GetLatest(ctx, template.ID)

	return &pb.GetTemplateResponse{
		Template:      s.templateModelToProto(template),
		LatestVersion: s.versionModelToProto(latest),
	}, nil
}

func (s *PromptService) ListTemplates(ctx context.Context, req *pb.ListTemplatesRequest) (*pb.ListTemplatesResponse, error) {
	limit := int(req.PageSize)
	if limit <= 0 {
		limit = 10
	}
	offset := 0 // TODO: parse page_token

	filters := make(map[string]interface{})
	if req.OwnerId != "" {
		filters["owner_id"] = req.OwnerId
	}
	// ... other filters

	templates, err := s.TemplateRepo.List(ctx, limit, offset, filters)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list templates: %v", err)
	}

	var pbTemplates []*pb.Template
	for _, t := range templates {
		pbTemplates = append(pbTemplates, s.templateModelToProto(t))
	}

	return &pb.ListTemplatesResponse{Templates: pbTemplates}, nil
}

func (s *PromptService) DeleteTemplate(ctx context.Context, req *pb.DeleteTemplateRequest) (*pb.DeleteTemplateResponse, error) {
	template, err := s.TemplateRepo.Get(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "template not found")
	}

	if req.OwnerId != "" && template.OwnerID != req.OwnerId {
		return nil, status.Errorf(codes.PermissionDenied, "not authorized")
	}

	if err := s.TemplateRepo.Delete(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete template: %v", err)
	}

	return &pb.DeleteTemplateResponse{Success: true}, nil
}

func (s *PromptService) ListCategories(ctx context.Context, req *pb.ListCategoriesRequest) (*pb.ListCategoriesResponse, error) {
	stats, err := s.TemplateRepo.ListCategories(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list categories: %v", err)
	}

	var pbStats []*pb.CategoryStats
	for _, s := range stats {
		pbStats = append(pbStats, &pb.CategoryStats{
			Name:  s.Name,
			Count: int32(s.Count),
		})
	}

	return &pb.ListCategoriesResponse{Categories: pbStats}, nil
}

func (s *PromptService) ListTags(ctx context.Context, req *pb.ListTagsRequest) (*pb.ListTagsResponse, error) {
	stats, err := s.TemplateRepo.ListTags(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list tags: %v", err)
	}

	var pbStats []*pb.TagStats
	for _, s := range stats {
		pbStats = append(pbStats, &pb.TagStats{
			Name:  s.Name,
			Count: int32(s.Count),
		})
	}

	return &pb.ListTagsResponse{Tags: pbStats}, nil
}

// --- Prompt RPCs ---

func (s *PromptService) CreatePrompt(ctx context.Context, req *pb.CreatePromptRequest) (*pb.CreatePromptResponse, error) {
	if req.OwnerId == "" {
		return nil, status.Error(codes.InvalidArgument, "owner_id is required")
	}

	variablesJSON, err := json.Marshal(req.Variables)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid variables: %v", err)
	}

	prompt := &models.Prompt{
		TemplateID: req.TemplateId,
		VersionID:  req.VersionId,
		OwnerID:    req.OwnerId,
		Variables:  variablesJSON,
	}

	if err := s.PromptRepo.Create(ctx, prompt); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create prompt: %v", err)
	}

	return &pb.CreatePromptResponse{
		Prompt: s.promptModelToProto(prompt),
	}, nil
}

func (s *PromptService) GetPrompt(ctx context.Context, req *pb.GetPromptRequest) (*pb.GetPromptResponse, error) {
	prompt, err := s.PromptRepo.Get(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "prompt not found")
	}
	return &pb.GetPromptResponse{Prompt: s.promptModelToProto(prompt)}, nil
}

func (s *PromptService) ListPrompts(ctx context.Context, req *pb.ListPromptsRequest) (*pb.ListPromptsResponse, error) {
	limit := int(req.PageSize)
	if limit <= 0 {
		limit = 10
	}
	offset := 0
	if req.PageToken != "" {
		if v, err := strconv.Atoi(req.PageToken); err == nil {
			offset = v
		}
	}

	prompts, err := s.PromptRepo.List(ctx, limit, offset, req.OwnerId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list prompts: %v", err)
	}

	var pbPrompts []*pb.Prompt
	for _, p := range prompts {
		pbPrompts = append(pbPrompts, s.promptModelToProto(p))
	}

	nextPageToken := ""
	if len(prompts) == limit {
		nextPageToken = strconv.Itoa(offset + limit)
	}

	return &pb.ListPromptsResponse{Prompts: pbPrompts, NextPageToken: nextPageToken}, nil
}

func (s *PromptService) DeletePrompt(ctx context.Context, req *pb.DeletePromptRequest) (*pb.DeletePromptResponse, error) {
	prompt, err := s.PromptRepo.Get(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "prompt not found")
	}

	if req.OwnerId != "" && prompt.OwnerID != req.OwnerId {
		return nil, status.Errorf(codes.PermissionDenied, "not authorized")
	}

	if err := s.PromptRepo.Delete(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete prompt: %v", err)
	}

	return &pb.DeletePromptResponse{Success: true}, nil
}

// --- Helpers ---

func (s *PromptService) templateModelToProto(m *models.Template) *pb.Template {
	if m == nil {
		return nil
	}
	vis := pb.Visibility_VISIBILITY_PRIVATE
	if m.Visibility == "public" {
		vis = pb.Visibility_VISIBILITY_PUBLIC
	}

	return &pb.Template{
		Id:          m.ID,
		OwnerId:     m.OwnerID,
		Title:       m.Title,
		Description: m.Description.String,
		Visibility:  vis,
		Tags:        m.Tags,
		Category:    m.Category.String,
		CreatedAt:   timestamppb.New(m.CreatedAt),
		UpdatedAt:   timestamppb.New(m.UpdatedAt),
	}
}

func (s *PromptService) versionModelToProto(m *models.TemplateVersion) *pb.TemplateVersion {
	if m == nil {
		return nil
	}
	return &pb.TemplateVersion{
		Id:         m.ID,
		TemplateId: m.TemplateID,
		Version:    m.Version,
		Content:    m.Content,
		CreatedAt:  timestamppb.New(m.CreatedAt),
	}
}

func (s *PromptService) promptModelToProto(m *models.Prompt) *pb.Prompt {
	if m == nil {
		return nil
	}
	var variables []string
	_ = json.Unmarshal(m.Variables, &variables)

	return &pb.Prompt{
		Id:         m.ID,
		TemplateId: m.TemplateID,
		VersionId:  m.VersionID,
		OwnerId:    m.OwnerID,
		Variables:  variables,
		CreatedAt:  timestamppb.New(m.CreatedAt),
	}
}
