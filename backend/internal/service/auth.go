package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// AuthInterceptor is a server interceptor that authenticates the user.
type AuthInterceptor struct {
	jwtSecret []byte
	// publicRpcMethods is a map of methods that do not require authentication
	publicRpcMethods map[string]bool
}

type contextKey string

const userIDKey contextKey = "user_id"

// ContextWithUserID adds the user ID to the context.
func ContextWithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// NewAuthInterceptor creates a new AuthInterceptor.
func NewAuthInterceptor(jwtSecret string) *AuthInterceptor {
	return &AuthInterceptor{
		jwtSecret: []byte(jwtSecret),
		publicRpcMethods: map[string]bool{
			"/v1.UserService/Register":         true,
			"/v1.UserService/Login":            true,
			"/v1.UserService/LoginWithOAuth":   true,
			"/v1.PromptService/ListTemplates":  true, // Allow public viewing? Maybe make it conditional essentially
			"/v1.PromptService/GetTemplate":    true,
			"/v1.PromptService/ListCategories": true,
			"/v1.PromptService/ListTags":       true,
			// For testing reflection
			"/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo": true,
		},
	}
}

// VerifyToken validates the token string and returns the user ID.
func (i *AuthInterceptor) VerifyToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return i.jwtSecret, nil
	})

	if err != nil {
		return "", status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["sub"].(string)
		if !ok {
			return "", status.Error(codes.Unauthenticated, "invalid token payload: missing sub")
		}
		return userID, nil
	}

	return "", status.Error(codes.Unauthenticated, "invalid token")
}

// Unary returns a server interceptor function to authenticate unary RPCs.
func (i *AuthInterceptor) Unary() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		// 1. Attempt to extract and verify token if present
		var tokenString string
		md, ok := metadata.FromIncomingContext(ctx)
		if ok {
			zap.S().Infof("AuthInterceptor: md=%v", md)
			values := md["authorization"]
			if len(values) > 0 {
				authHeader := values[0]
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
					tokenString = parts[1]
				}
			}
		}

		if tokenString != "" {
			// Token is present, verify it
			userID, err := i.VerifyToken(tokenString)
			if err != nil {
				return nil, err // Fail if token provided but invalid
			}
			// Inject User ID into Context
			newCtx := context.WithValue(ctx, userIDKey, userID)
			return handler(newCtx, req)
		}

		// 2. If no token, check if the method is public
		if i.publicRpcMethods[info.FullMethod] {
			return handler(ctx, req)
		}

		// 3. Not public and no token -> Fail
		return nil, status.Error(codes.Unauthenticated, "missing authorization token")
	}
}

// GetUserIDFromContext retrieves the user ID from the context.
func GetUserIDFromContext(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(userIDKey).(string)
	if !ok {
		return "", status.Error(codes.Unauthenticated, "user not authenticated")
	}
	return userID, nil
}
