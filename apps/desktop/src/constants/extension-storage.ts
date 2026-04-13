export const EXT_STORAGE_KEYS = {
  authAccessToken: "nanopaste.extension.auth.access_token",
  authRefreshToken: "nanopaste.extension.auth.refresh_token",
  authExpiresInSeconds: "nanopaste.extension.auth.expires_in_seconds",
  authUsername: "nanopaste.extension.auth.username",
  runtimeApiBaseUrl: "nanopaste.extension.runtime.api_base_url",
} as const;

export const DEFAULT_API_BASE_URL = "http://localhost:8080";
