package auth

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/ronronner/my-todolist/apps/backend/internal/common"
	"github.com/ronronner/my-todolist/apps/backend/internal/db"
)

type handler struct {
	repo       *repository
	jwtSecret  []byte
	issuer     string
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewHandler() (http.Handler, error) {
	sqlite, err := db.SQLite()
	if err != nil {
		return nil, err
	}

	h := &handler{
		repo:       newRepository(sqlite),
		jwtSecret:  []byte(envOrDefault("JWT_SECRET", "dev-secret-change-me")),
		issuer:     envOrDefault("JWT_ISSUER", "nanopaste-backend"),
		accessTTL:  time.Duration(envIntOrDefault("ACCESS_TOKEN_TTL_MINUTES", 60)) * time.Minute,
		refreshTTL: time.Duration(envIntOrDefault("REFRESH_TOKEN_TTL_HOURS", 24*30)) * time.Hour,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/auth/login", h.login)
	mux.HandleFunc("/v1/auth/refresh", h.refresh)
	mux.HandleFunc("/v1/auth/logout", h.logout)
	return mux, nil
}

func (h *handler) login(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	account := strings.TrimSpace(req.accountValue())
	password := strings.TrimSpace(req.Password)
	if account == "" || password == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "username/account and password are required", nil, requestID)
		return
	}

	user, err := h.repo.findUserByAccount(r.Context(), account)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to load user", nil, requestID)
		return
	}

	if user == nil {
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			common.WriteError(w, common.INTERNAL, "failed to hash password", nil, requestID)
			return
		}
		user, err = h.repo.createUser(r.Context(), account, string(hash))
		if err != nil {
			common.WriteError(w, common.INTERNAL, "failed to create user", nil, requestID)
			return
		}
	} else {
		if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
			common.WriteError(w, common.UNAUTHORIZED, "invalid credentials", nil, requestID)
			return
		}
	}

	deviceID, err := h.repo.upsertDevice(r.Context(), user.ID, strings.TrimSpace(req.deviceNameValue()), strings.TrimSpace(req.Platform), strings.TrimSpace(req.clientVersionValue()))
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to upsert device", nil, requestID)
		return
	}

	refreshToken, err := generateOpaqueToken(48)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to generate refresh token", nil, requestID)
		return
	}

	now := time.Now().UTC()
	accessExp := now.Add(h.accessTTL)
	refreshExp := now.Add(h.refreshTTL)

	sessionID, err := h.repo.createSession(r.Context(), user.ID, deviceID, refreshToken, accessExp, refreshExp)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to create session", nil, requestID)
		return
	}

	accessToken, err := h.signAccessToken(user.ID, user.Account, sessionID, deviceID, accessExp)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to sign access token", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, loginResponse{
		UserID:   user.ID,
		Username: user.Account,
		Account:  user.Account,
		DeviceID: deviceID,
		Tokens: tokenPair{
			AccessToken:      accessToken,
			RefreshToken:     refreshToken,
			ExpiresInSeconds: int64(h.accessTTL.Seconds()),
		},
	}, requestID)
}

func (h *handler) refresh(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	refreshToken := strings.TrimSpace(req.refreshTokenValue())
	if refreshToken == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "refresh token is required", nil, requestID)
		return
	}

	session, err := h.repo.findActiveSessionByRefreshToken(r.Context(), refreshToken)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to load session", nil, requestID)
		return
	}
	if session == nil {
		common.WriteError(w, common.UNAUTHORIZED, "invalid refresh token", nil, requestID)
		return
	}

	newRefreshToken, err := generateOpaqueToken(48)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to generate refresh token", nil, requestID)
		return
	}

	now := time.Now().UTC()
	accessExp := now.Add(h.accessTTL)
	refreshExp := now.Add(h.refreshTTL)

	if err = h.repo.rotateRefreshToken(r.Context(), session.ID, refreshToken, newRefreshToken, accessExp, refreshExp); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			common.WriteError(w, common.UNAUTHORIZED, "invalid refresh token", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to rotate refresh token", nil, requestID)
		return
	}

	deviceID := strings.TrimSpace(session.DeviceID.String)
	if !session.DeviceID.Valid || deviceID == "" {
		common.WriteError(w, common.UNAUTHORIZED, "invalid refresh token", nil, requestID)
		return
	}

	accessToken, err := h.signAccessToken(session.UserID, "", session.ID, deviceID, accessExp)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to sign access token", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, refreshResponse{
		DeviceID: deviceID,
		Tokens: tokenPair{
			AccessToken:      accessToken,
			RefreshToken:     newRefreshToken,
			ExpiresInSeconds: int64(h.accessTTL.Seconds()),
		},
	}, requestID)
}

func (h *handler) logout(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	var req logoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	refreshToken := strings.TrimSpace(req.refreshTokenValue())
	if refreshToken != "" {
		session, err := h.repo.findActiveSessionByRefreshToken(r.Context(), refreshToken)
		if err != nil {
			common.WriteError(w, common.INTERNAL, "failed to load session", nil, requestID)
			return
		}

		if req.allDevicesValue() {
			if session != nil {
				if err = h.repo.revokeByUserID(r.Context(), session.UserID); err != nil {
					common.WriteError(w, common.INTERNAL, "failed to revoke sessions", nil, requestID)
					return
				}
			}
		} else {
			if err = h.repo.revokeByRefreshToken(r.Context(), refreshToken); err != nil {
				common.WriteError(w, common.INTERNAL, "failed to revoke refresh token", nil, requestID)
				return
			}
		}
	}

	common.WriteSuccess(w, http.StatusOK, logoutResponse{Success: true}, requestID)
}

func (h *handler) signAccessToken(userID, account, sessionID, deviceID string, exp time.Time) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"iss": h.issuer,
		"iat": time.Now().UTC().Unix(),
		"exp": exp.UTC().Unix(),
		"sid": sessionID,
		"did": deviceID,
	}
	if account != "" {
		claims["account"] = account
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(h.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}
	return signed, nil
}

func generateOpaqueToken(rawBytes int) (string, error) {
	b := make([]byte, rawBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func envOrDefault(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}

func envIntOrDefault(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}
