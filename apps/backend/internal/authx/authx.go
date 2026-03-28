package authx

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var errUnauthorized = errors.New("unauthorized")

func UserIDFromRequest(r *http.Request) (string, error) {
	claims, err := claimsFromRequest(r)
	if err != nil {
		return "", err
	}

	if strings.TrimSpace(claims.userID) == "" {
		return "", errUnauthorized
	}

	if strings.TrimSpace(claims.deviceID) == "" {
		return "", errUnauthorized
	}

	return claims.userID, nil
}

func DeviceIDFromRequest(r *http.Request) (string, error) {
	claims, err := claimsFromRequest(r)
	if err != nil {
		return "", err
	}

	if strings.TrimSpace(claims.deviceID) == "" {
		return "", errUnauthorized
	}

	return claims.deviceID, nil
}

type tokenClaims struct {
	userID   string
	deviceID string
}

func claimsFromRequest(r *http.Request) (tokenClaims, error) {
	// 1. 尝试从 Header 读取（HTTP API 标准方式）
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	tokenString := ""

	if strings.HasPrefix(authorization, "Bearer ") {
		tokenString = strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
	}

	// 2. 如果 Header 没有，尝试从 Query 参数读取（WebSocket 浏览器兼容性）
	if tokenString == "" {
		tokenString = strings.TrimSpace(r.URL.Query().Get("access_token"))
	}

	if tokenString == "" {
		return tokenClaims{}, errUnauthorized
	}

	secret := []byte(envOrDefault("JWT_SECRET", "dev-secret-change-me"))
	parsed, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if token.Method == nil || token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errUnauthorized
		}
		return secret, nil
	})
	if err != nil || !parsed.Valid {
		return tokenClaims{}, errUnauthorized
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return tokenClaims{}, errUnauthorized
	}

	sub, _ := claims["sub"].(string)
	did, _ := claims["did"].(string)

	if strings.TrimSpace(sub) == "" || strings.TrimSpace(did) == "" {
		return tokenClaims{}, errUnauthorized
	}

	return tokenClaims{
		userID:   strings.TrimSpace(sub),
		deviceID: strings.TrimSpace(did),
	}, nil
}

func envOrDefault(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}
