package auth

type loginRequest struct {
	Username           string `json:"username"`
	Account            string `json:"account"`
	Password           string `json:"password"`
	DeviceName         string `json:"device_name"`
	DeviceNameCamel    string `json:"deviceName"`
	Platform           string `json:"platform"`
	ClientVersion      string `json:"client_version"`
	ClientVersionCamel string `json:"clientVersion"`
}

func (r loginRequest) accountValue() string {
	if r.Username != "" {
		return r.Username
	}
	return r.Account
}

func (r loginRequest) deviceNameValue() string {
	if r.DeviceName != "" {
		return r.DeviceName
	}
	return r.DeviceNameCamel
}

func (r loginRequest) clientVersionValue() string {
	if r.ClientVersion != "" {
		return r.ClientVersion
	}
	return r.ClientVersionCamel
}

type refreshRequest struct {
	RefreshToken      string `json:"refresh_token"`
	RefreshTokenCamel string `json:"refreshToken"`
}

func (r refreshRequest) refreshTokenValue() string {
	if r.RefreshToken != "" {
		return r.RefreshToken
	}
	return r.RefreshTokenCamel
}

type logoutRequest struct {
	RefreshToken      string `json:"refresh_token"`
	RefreshTokenCamel string `json:"refreshToken"`
	AllDevices        bool   `json:"all_devices"`
	AllDevicesCamel   bool   `json:"allDevices"`
}

func (r logoutRequest) refreshTokenValue() string {
	if r.RefreshToken != "" {
		return r.RefreshToken
	}
	return r.RefreshTokenCamel
}

func (r logoutRequest) allDevicesValue() bool {
	return r.AllDevices || r.AllDevicesCamel
}

type tokenPair struct {
	AccessToken      string `json:"access_token"`
	RefreshToken     string `json:"refresh_token"`
	ExpiresInSeconds int64  `json:"expires_in_seconds"`
}

type loginResponse struct {
	UserID   string    `json:"user_id"`
	Username string    `json:"username"`
	Account  string    `json:"account,omitempty"`
	DeviceID string    `json:"deviceId"`
	Tokens   tokenPair `json:"tokens"`
}

type refreshResponse struct {
	DeviceID string    `json:"deviceId"`
	Tokens   tokenPair `json:"tokens"`
}

type logoutResponse struct {
	Success bool `json:"success"`
}
