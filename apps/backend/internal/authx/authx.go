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
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(authorization, "Bearer ") {
		return "", errUnauthorized
	}

	tokenString := strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
	if tokenString == "" {
		return "", errUnauthorized
	}

	secret := []byte(envOrDefault("JWT_SECRET", "dev-secret-change-me"))
	parsed, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if token.Method == nil || token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errUnauthorized
		}
		return secret, nil
	})
	if err != nil || !parsed.Valid {
		return "", errUnauthorized
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return "", errUnauthorized
	}

	sub, _ := claims["sub"].(string)
	if strings.TrimSpace(sub) == "" {
		return "", errUnauthorized
	}

	return strings.TrimSpace(sub), nil
}

func DeviceIDFromRequest(r *http.Request) string {
	deviceID := strings.TrimSpace(r.Header.Get("X-Device-Id"))
	if deviceID == "" {
		return "device_unknown"
	}
	return deviceID
}

func envOrDefault(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}
