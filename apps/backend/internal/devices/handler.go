package devices

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/ronronner/my-todolist/apps/backend/internal/authx"
	"github.com/ronronner/my-todolist/apps/backend/internal/common"
	"github.com/ronronner/my-todolist/apps/backend/internal/db"
)

type handler struct {
	repo *repository
}

func NewHandler() (http.Handler, error) {
	sqlite, err := db.SQLite()
	if err != nil {
		return nil, err
	}

	h := &handler{repo: newRepository(sqlite)}
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/devices/register", h.register)
	mux.HandleFunc("/v1/devices/heartbeat", h.heartbeat)
	mux.HandleFunc("/v1/devices", h.list)
	mux.HandleFunc("/v1/devices/revoke", h.revoke)
	return mux, nil
}

func (h *handler) register(w http.ResponseWriter, r *http.Request) {
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

	var req registerDeviceRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	deviceName := strings.TrimSpace(req.deviceNameValue())
	if deviceName == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "deviceName is required", nil, requestID)
		return
	}

	platform := normalizePlatform(req.Platform)
	d, err := h.repo.registerDevice(r.Context(), userID, deviceName, platform, req.clientVersionValue())
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to register device", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, registerDeviceResponse{Device: toDeviceInfo(d)}, requestID)
}

func (h *handler) heartbeat(w http.ResponseWriter, r *http.Request) {
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

	var req heartbeatRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	deviceID := strings.TrimSpace(req.deviceIDValue())
	if deviceID == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "deviceId is required", nil, requestID)
		return
	}

	ackAt, err := h.repo.heartbeat(r.Context(), userID, deviceID)
	if err != nil {
		if errors.Is(err, errDeviceNotFound) {
			common.WriteError(w, common.NOT_FOUND, "device not found", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to update heartbeat", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, heartbeatResponse{
		DeviceID:       deviceID,
		AcknowledgedAt: ackAt,
	}, requestID)
}

func (h *handler) list(w http.ResponseWriter, r *http.Request) {
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

	rows, err := h.repo.listDevices(r.Context(), userID)
	if err != nil {
		common.WriteError(w, common.INTERNAL, "failed to list devices", nil, requestID)
		return
	}

	devices := make([]deviceInfo, 0, len(rows))
	for _, row := range rows {
		devices = append(devices, toDeviceInfo(row))
	}

	common.WriteSuccess(w, http.StatusOK, listDevicesResponse{Devices: devices}, requestID)
}

func (h *handler) revoke(w http.ResponseWriter, r *http.Request) {
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

	var req revokeDeviceRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.WriteError(w, common.VALIDATION_ERROR, "invalid json body", nil, requestID)
		return
	}

	deviceID := strings.TrimSpace(req.deviceIDValue())
	if deviceID == "" {
		common.WriteError(w, common.VALIDATION_ERROR, "deviceId is required", nil, requestID)
		return
	}

	revokedAt, err := h.repo.revokeDevice(r.Context(), userID, deviceID)
	if err != nil {
		if errors.Is(err, errDeviceNotFound) {
			common.WriteError(w, common.NOT_FOUND, "device not found", nil, requestID)
			return
		}
		common.WriteError(w, common.INTERNAL, "failed to revoke device", nil, requestID)
		return
	}

	common.WriteSuccess(w, http.StatusOK, revokeDeviceResponse{
		Success:   true,
		RevokedAt: revokedAt,
	}, requestID)
}
