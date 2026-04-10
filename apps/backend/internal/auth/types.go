package auth

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (r loginRequest) usernameValue() string {
	return r.Username
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
	AllSessions       bool   `json:"all_sessions"`
	AllSessionsCamel  bool   `json:"allSessions"`
}

func (r logoutRequest) refreshTokenValue() string {
	if r.RefreshToken != "" {
		return r.RefreshToken
	}
	return r.RefreshTokenCamel
}

func (r logoutRequest) allSessionsValue() bool {
	return r.AllSessions || r.AllSessionsCamel
}

type tokenPair struct {
	AccessToken      string `json:"access_token"`
	RefreshToken     string `json:"refresh_token"`
	ExpiresInSeconds int64  `json:"expires_in_seconds"`
}

type loginResponse struct {
	UserID   string    `json:"user_id"`
	Username string    `json:"username"`
	Tokens   tokenPair `json:"tokens"`
}

type refreshResponse struct {
	Tokens tokenPair `json:"tokens"`
}

type logoutResponse struct {
	Success bool `json:"success"`
}
