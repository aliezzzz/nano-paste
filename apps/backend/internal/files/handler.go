package files

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/ronronner/my-todolist/apps/backend/internal/authx"
	"github.com/ronronner/my-todolist/apps/backend/internal/common"
	"github.com/ronronner/my-todolist/apps/backend/internal/db"
	"github.com/ronronner/my-todolist/apps/backend/internal/events"
)

type handler struct {
	repo *repository
	hub  *events.Hub
}

func NewHandler(hub *events.Hub) (http.Handler, error) {
	sqlite, err := db.SQLite()
	if err != nil {
		return nil, err
	}

	h := &handler{repo: newRepository(sqlite), hub: hub}
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/files/prepare-upload", h.prepareUpload)
	mux.HandleFunc("/v1/files/upload/", h.uploadByID)
	mux.HandleFunc("/v1/files/download/", h.downloadByID)
	mux.HandleFunc("/v1/files/complete", h.complete)
	mux.HandleFunc("/v1/files/cleanup", h.cleanup)
	mux.HandleFunc("/v1/files/", h.fileByID)
	return mux, nil
}

func (h *handler) fileByID(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	trimmed := strings.TrimPrefix(r.URL.Path, "/v1/files/")
	parts := strings.Split(trimmed, "/")
	if len(parts) != 2 || strings.TrimSpace(parts[0]) == "" || parts[1] != "prepare-download" {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	h.prepareDownload(w, r, strings.TrimSpace(parts[0]))
}

func (h *handler) prepareUpload(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	var req prepareUploadRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	fileName := strings.TrimSpace(req.FileName)
	if fileName == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "fileName is required", nil, requestID)
		return
	}
	if req.FileSize <= 0 {
		common.WriteError(w, common.VALIDATION_ERROR, "fileSize must be > 0", nil, requestID)
		return
	}

	category := normalizeCategory(req.categoryValue())
	out, err := h.repo.prepareUpload(r.Context(), prepareUploadInput{
		UserID:   userID,
		FileName: fileName,
		FileSize: req.FileSize,
		MimeType: strings.TrimSpace(req.MimeType),
		SHA256:   strings.TrimSpace(req.SHA256),
		Category: category,
	})
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to prepare upload", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, prepareUploadResponse{
		FileID:       out.FileID,
		UploadURL:    signedUploadURL(r, out.FileID, accessTokenFromRequest(r)),
		UploadMethod: out.UploadMethod,
		ExpiresAt:    out.ExpiresAt,
		Category:     out.Category,
	}, requestID)
}

func (h *handler) uploadByID(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	fileID := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/v1/files/upload/"))
	if fileID == "" || strings.Contains(fileID, "/") {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	if err = h.repo.verifyUploadTarget(r.Context(), userID, fileID); err != nil {
		if err == errFileNotFound {
			common.WriteError(w, common.NOT_FOUND, "file not found", nil, requestID)
			return
		}
		if err == errFileNotPending {
			common.WriteError(w, common.CONFLICT, "file is not pending", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to verify upload target", nil, requestID)
		return
	}

	filePath, err := storageFilePath(userID, fileID)
	if err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid file id", nil, requestID)
		return
	}

	if err = os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		common.WriteError(w, common.INTERNAL, "failed to create storage dir", nil, requestID)
		return
	}

	tmpPath := filePath + ".tmp"
	tmpFile, err := os.Create(tmpPath)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to create temp file", nil, requestID)
		return
	}

	hasher := sha256.New()
	if _, err = io.Copy(io.MultiWriter(tmpFile, hasher), r.Body); err != nil {
		_ = tmpFile.Close()
		_ = os.Remove(tmpPath)
		common.WriteError(w, common.INTERNAL, "failed to write upload data", nil, requestID)
		return
	}

	if err = tmpFile.Close(); err != nil {
		_ = os.Remove(tmpPath)
		common.WriteError(w, common.INTERNAL, "failed to flush upload data", nil, requestID)
		return
	}

	if err = os.Rename(tmpPath, filePath); err != nil {
		_ = os.Remove(tmpPath)
		common.WriteError(w, common.INTERNAL, "failed to persist upload file", nil, requestID)
		return
	}

	w.Header().Set("ETag", fmt.Sprintf("\"sha256-%s\"", hex.EncodeToString(hasher.Sum(nil))))
	w.WriteHeader(http.StatusOK)
}

func (h *handler) downloadByID(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodGet {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	fileID := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/v1/files/download/"))
	if fileID == "" || strings.Contains(fileID, "/") {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	out, err := h.repo.prepareDownload(r.Context(), userID, fileID)
	if err != nil {
		if err == errFileNotFound {
			common.WriteError(w, common.NOT_FOUND, "file not found", nil, requestID)
			return
		}
		if err == errFileNotReady {
			common.WriteError(w, common.CONFLICT, "file not completed yet", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to query download file", nil, requestID)
		return
	}

	filePath, err := storageFilePath(userID, fileID)
	if err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid file id", nil, requestID)
		return
	}

	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			common.WriteError(w, common.NOT_FOUND, "file content not found", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to open file", nil, requestID)
		return
	}
	defer func() { _ = file.Close() }()

	info, err := file.Stat()
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to stat file", nil, requestID)
		return
	}

	contentType := mime.TypeByExtension(filepath.Ext(out.FileName))
	if strings.TrimSpace(contentType) == "" {
		contentType = "application/octet-stream"
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", out.FileName))
	w.Header().Set("Content-Length", strconv.FormatInt(info.Size(), 10))
	http.ServeContent(w, r, out.FileName, info.ModTime(), file)
}

func (h *handler) complete(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	deviceID, err := authx.DeviceIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	var req completeUploadRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	if strings.TrimSpace(req.FileID) == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "fileId is required", nil, requestID)
		return
	}

	out, ev, err := h.repo.completeUpload(r.Context(), completeUploadInput{
		UserID:   userID,
		DeviceID: deviceID,
		FileID:   strings.TrimSpace(req.FileID),
		ETag:     strings.TrimSpace(req.ETag),
		SHA256:   strings.TrimSpace(req.SHA256),
	})
	if err != nil {
		if err == errFileNotFound {
			common.WriteError(w, common.NOT_FOUND, "file not found", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to complete upload", nil, requestID)
		return
	}

	h.broadcast(ev)

	common.WriteSuccess(w, http.StatusOK, completeUploadResponse{
		ItemID:   out.ItemID,
		FileID:   out.FileID,
		Ready:    true,
		Category: out.Category,
	}, requestID)
}

func (h *handler) prepareDownload(w http.ResponseWriter, r *http.Request, fileID string) {
	requestID := common.RequestIDFromContext(r.Context())
	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	out, err := h.repo.prepareDownload(r.Context(), userID, fileID)
	if err != nil {
		if err == errFileNotFound {
			common.WriteError(w, common.NOT_FOUND, "file not found", nil, requestID)
			return
		}
		if err == errFileNotReady {
			common.WriteError(w, common.CONFLICT, "file not completed yet", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to prepare download", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, prepareDownloadResponse{
		FileID:      out.FileID,
		FileName:    out.FileName,
		FileSize:    out.FileSize,
		DownloadURL: signedDownloadURL(r, out.FileID, accessTokenFromRequest(r)),
		ExpiresAt:   out.ExpiresAt,
		Category:    out.Category,
	}, requestID)
}

func (h *handler) cleanup(w http.ResponseWriter, r *http.Request) {
	requestID := common.RequestIDFromContext(r.Context())
	if r.Method != http.MethodPost {
		common.WriteError(w, common.NOT_FOUND, "not found", nil, requestID)
		return
	}

	userID, err := authx.UserIDFromRequest(r)
	if err != nil {
		common.WriteError(w, common.UNAUTHORIZED, "missing or invalid access token", nil, requestID)
		return
	}

	var req cleanupRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	reason := strings.TrimSpace(req.reasonValue())
	if reason != "manual" && reason != "expired" {
		reason = "manual"
	}

	itemIDs := make([]string, 0, len(req.itemIDsValue()))
	for _, id := range req.itemIDsValue() {
		id = strings.TrimSpace(id)
		if id != "" {
			itemIDs = append(itemIDs, id)
		}
	}

	out, ev, err := h.repo.cleanupFiles(r.Context(), cleanupInput{
		UserID:     userID,
		Reason:     reason,
		ItemIDs:    itemIDs,
		BeforeTime: strings.TrimSpace(req.beforeTimeValue()),
		Category:   req.categoryValue(),
	})
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to cleanup files", nil, requestID)
		return
	}

	for _, e := range ev {
		h.broadcast(e)
	}

	for _, fileID := range out.RemovedFileIDs {
		_ = removeStoredFile(userID, fileID)
	}

	common.WriteSuccess(w, http.StatusOK, cleanupResponse{
		Success:        true,
		Reason:         reason,
		Removed:        out.Removed,
		RemovedFileIDs: out.RemovedFileIDs,
		CleanedAt:      out.CleanedAt,
	}, requestID)
}

func (h *handler) broadcast(ev eventRow) {
	if ev.ID == 0 || strings.TrimSpace(ev.UserID) == "" {
		return
	}
	payload := json.RawMessage(ev.Payload)
	if len(payload) == 0 {
		payload = json.RawMessage("{}")
	}
	h.hub.BroadcastEvent(events.StoredEvent{
		ID:        ev.ID,
		UserID:    ev.UserID,
		EventType: ev.EventType,
		ItemID:    ev.ItemID,
		FileID:    ev.FileID,
		Payload:   payload,
		CreatedAt: ev.CreatedAt,
	})
}

func signedUploadURL(r *http.Request, fileID, accessToken string) string {
	scheme := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto"))
	if scheme == "" {
		scheme = "http"
	}
	host := strings.TrimSpace(r.Host)
	if host == "" {
		host = "localhost:8080"
	}
	base := fmt.Sprintf("%s://%s/v1/files/upload/%s", scheme, host, fileID)
	if strings.TrimSpace(accessToken) == "" {
		return base
	}
	return base + "?access_token=" + url.QueryEscape(accessToken)
}

func signedDownloadURL(r *http.Request, fileID, accessToken string) string {
	scheme := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto"))
	if scheme == "" {
		scheme = "http"
	}
	host := strings.TrimSpace(r.Host)
	if host == "" {
		host = "localhost:8080"
	}
	base := fmt.Sprintf("%s://%s/v1/files/download/%s", scheme, host, fileID)
	if strings.TrimSpace(accessToken) == "" {
		return base
	}
	return base + "?access_token=" + url.QueryEscape(accessToken)
}

func accessTokenFromRequest(r *http.Request) string {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if strings.HasPrefix(authorization, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
	}
	return strings.TrimSpace(r.URL.Query().Get("access_token"))
}

func storageRootDir() string {
	root := strings.TrimSpace(os.Getenv("FILE_STORAGE_ROOT"))
	if root == "" {
		return "./data/storage"
	}
	return root
}

func storageFilePath(userID, fileID string) (string, error) {
	if !isSafePathSegment(userID) || !isSafePathSegment(fileID) {
		return "", fmt.Errorf("invalid storage path segment")
	}
	return filepath.Join(storageRootDir(), userID, fileID), nil
}

func removeStoredFile(userID, fileID string) error {
	filePath, err := storageFilePath(userID, fileID)
	if err != nil {
		return err
	}
	if err = os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func isSafePathSegment(segment string) bool {
	v := strings.TrimSpace(segment)
	if v == "" || v == "." || v == ".." {
		return false
	}
	if strings.Contains(v, "/") || strings.Contains(v, "\\") {
		return false
	}
	return true
}

type prepareUploadRequest struct {
	FileName string `json:"fileName"`
	FileSize int64  `json:"fileSize"`
	MimeType string `json:"mimeType"`
	SHA256   string `json:"sha256"`
	Category string `json:"category"`
}

func (r prepareUploadRequest) categoryValue() string {
	return strings.TrimSpace(r.Category)
}

type prepareUploadResponse struct {
	FileID       string `json:"fileId"`
	UploadURL    string `json:"uploadUrl"`
	UploadMethod string `json:"uploadMethod"`
	ExpiresAt    string `json:"expiresAt"`
	Category     string `json:"category"`
}

type completeUploadRequest struct {
	FileID string `json:"fileId"`
	ETag   string `json:"etag"`
	SHA256 string `json:"sha256"`
}

type completeUploadResponse struct {
	ItemID   string `json:"itemId"`
	FileID   string `json:"fileId"`
	Ready    bool   `json:"ready"`
	Category string `json:"category"`
}

type prepareDownloadResponse struct {
	FileID      string `json:"fileId"`
	FileName    string `json:"fileName"`
	FileSize    int64  `json:"fileSize"`
	DownloadURL string `json:"downloadUrl"`
	ExpiresAt   string `json:"expiresAt"`
	Category    string `json:"category"`
}

type cleanupRequest struct {
	Reason          string   `json:"reason"`
	ReasonSnake     string   `json:"cleanup_reason"`
	ItemIDs         []string `json:"itemIds"`
	ItemIDsSnake    []string `json:"item_ids"`
	BeforeTime      string   `json:"beforeTime"`
	BeforeTimeSnake string   `json:"before_time"`
	Category        string   `json:"category"`
}

func (r cleanupRequest) reasonValue() string {
	if strings.TrimSpace(r.Reason) != "" {
		return strings.TrimSpace(r.Reason)
	}
	return strings.TrimSpace(r.ReasonSnake)
}

func (r cleanupRequest) beforeTimeValue() string {
	if strings.TrimSpace(r.BeforeTime) != "" {
		return strings.TrimSpace(r.BeforeTime)
	}
	return strings.TrimSpace(r.BeforeTimeSnake)
}

func (r cleanupRequest) categoryValue() string {
	return strings.TrimSpace(r.Category)
}

func (r cleanupRequest) itemIDsValue() []string {
	if len(r.ItemIDs) > 0 {
		return r.ItemIDs
	}
	return r.ItemIDsSnake
}

type cleanupResponse struct {
	Success        bool     `json:"success"`
	Reason         string   `json:"reason"`
	Removed        int      `json:"removed"`
	RemovedFileIDs []string `json:"removedFileIds"`
	CleanedAt      string   `json:"cleanedAt"`
}
