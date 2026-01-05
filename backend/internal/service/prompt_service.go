package service

import (
	"context"
	"strconv"

	pb "awsome-prompt/backend/api/proto/v1"
	"awsome-prompt/backend/internal/repository"

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
	if req.Visibility != pb.Visibility_VISIBILITY_UNSPECIFIED {
		if req.Visibility == pb.Visibility_VISIBILITY_PUBLIC {
			filters["visibility"] = "public"
		} else if req.Visibility == pb.Visibility_VISIBILITY_PRIVATE {
			filters["visibility"] = "private"
		}
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
		pbTemplates = append(pbTemplates, &pb.Template{
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
		})
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
