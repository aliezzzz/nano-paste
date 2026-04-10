import { request } from "./request";

export interface AuthTokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

interface LoginInput {
  baseUrl: string;
  username: string;
  password: string;
}

interface LoginResult {
  username?: string;
  tokens: AuthTokenBundle;
}

export async function loginWithPassword(input: LoginInput): Promise<LoginResult> {
  const payload = await postApi<LoginApiData>(`${input.baseUrl}/v1/auth/login`, {
    username: input.username,
    password: input.password,
  });

  return {
    username: payload.username ?? input.username,
    tokens: mapTokenPayload(payload.tokens),
  };
}

export async function refreshWithToken(
  baseUrl: string,
  refreshToken: string,
): Promise<{ tokens: AuthTokenBundle }> {
  const payload = await postApi<RefreshApiData>(`${baseUrl}/v1/auth/refresh`, {
    refresh_token: refreshToken,
    refreshToken,
  });

  return {
    tokens: mapTokenPayload(payload.tokens),
  };
}

export async function logoutWithRefreshToken(baseUrl: string, refreshToken: string): Promise<void> {
  await postApi(`${baseUrl}/v1/auth/logout`, {
    refresh_token: refreshToken,
    refreshToken,
    all_sessions: false,
    allSessions: false,
  });
}

interface LoginApiData {
  username?: string;
  tokens: TokenPayload;
}

interface RefreshApiData {
  tokens: TokenPayload;
}

interface TokenPayload {
  access_token?: string;
  refresh_token?: string;
  expires_in_seconds?: number;
  accessToken?: string;
  refreshToken?: string;
  expiresInSeconds?: number;
}

async function postApi<T>(url: string, body: unknown): Promise<T> {
  return request<T>({
    method: "POST",
    url,
    data: body,
    baseURL: "",
    skipBaseUrl: true,
    authRequired: false,
    retryOnUnauthorized: false,
  });
}

function mapTokenPayload(payload: TokenPayload): AuthTokenBundle {
  const accessToken = payload.access_token ?? payload.accessToken ?? "";
  const refreshToken = payload.refresh_token ?? payload.refreshToken ?? "";
  const expiresInSeconds = payload.expires_in_seconds ?? payload.expiresInSeconds ?? 0;

  if (!accessToken || !refreshToken || !expiresInSeconds) {
    throw new Error("invalid token payload");
  }

  return {
    accessToken,
    refreshToken,
    expiresInSeconds,
  };
}
