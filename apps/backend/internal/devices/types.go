package devices

import "strings"

type deviceInfo struct {
	DeviceID   string  `json:"deviceId"`
	DeviceName string  `json:"deviceName"`
	Platform   string  `json:"platform"`
	LastSeenAt string  `json:"lastSeenAt"`
	CreatedAt  string  `json:"createdAt"`
	RevokedAt  *string `json:"revokedAt,omitempty"`
	IsActive   bool    `json:"isActive"`
	ClientVer  *string `json:"clientVersion,omitempty"`
}

type registerDeviceRequest struct {
	DeviceName      string `json:"deviceName"`
	DeviceNameSnake string `json:"device_name"`
	Platform        string `json:"platform"`
	ClientVersion   string `json:"clientVersion"`
	ClientVerSnake  string `json:"client_version"`
}

func (r registerDeviceRequest) deviceNameValue() string {
	if strings.TrimSpace(r.DeviceName) != "" {
		return strings.TrimSpace(r.DeviceName)
	}
	return strings.TrimSpace(r.DeviceNameSnake)
}

func (r registerDeviceRequest) clientVersionValue() string {
	if strings.TrimSpace(r.ClientVersion) != "" {
		return strings.TrimSpace(r.ClientVersion)
	}
	return strings.TrimSpace(r.ClientVerSnake)
}

type registerDeviceResponse struct {
	Device deviceInfo `json:"device"`
}

type heartbeatRequest struct {
	DeviceID      string `json:"deviceId"`
	DeviceIDSnake string `json:"device_id"`
	Status        string `json:"status"`
}

func (r heartbeatRequest) deviceIDValue() string {
	if strings.TrimSpace(r.DeviceID) != "" {
		return strings.TrimSpace(r.DeviceID)
	}
	return strings.TrimSpace(r.DeviceIDSnake)
}

type heartbeatResponse struct {
	DeviceID       string `json:"deviceId"`
	AcknowledgedAt string `json:"acknowledgedAt"`
}

type listDevicesResponse struct {
	Devices []deviceInfo `json:"devices"`
}

type revokeDeviceRequest struct {
	DeviceID      string `json:"deviceId"`
	DeviceIDSnake string `json:"device_id"`
}

func (r revokeDeviceRequest) deviceIDValue() string {
	if strings.TrimSpace(r.DeviceID) != "" {
		return strings.TrimSpace(r.DeviceID)
	}
	return strings.TrimSpace(r.DeviceIDSnake)
}

type revokeDeviceResponse struct {
	Success   bool   `json:"success"`
	RevokedAt string `json:"revokedAt"`
}

func toDeviceInfo(row deviceRow) deviceInfo {
	var revokedAt *string
	if row.RevokedAt.Valid {
		v := strings.TrimSpace(row.RevokedAt.String)
		revokedAt = &v
	}

	var clientVer *string
	if strings.TrimSpace(row.ClientVer) != "" {
		v := strings.TrimSpace(row.ClientVer)
		clientVer = &v
	}

	return deviceInfo{
		DeviceID:   row.ID,
		DeviceName: row.DeviceName,
		Platform:   normalizePlatform(row.Platform),
		LastSeenAt: row.LastSeenAt,
		CreatedAt:  row.CreatedAt,
		RevokedAt:  revokedAt,
		IsActive:   revokedAt == nil,
		ClientVer:  clientVer,
	}
}

func normalizePlatform(platform string) string {
	switch strings.ToLower(strings.TrimSpace(platform)) {
	case "macos", "windows", "linux", "web", "android":
		return strings.ToLower(strings.TrimSpace(platform))
	default:
		return "unknown"
	}
}
