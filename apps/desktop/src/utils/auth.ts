import type { LoginResponse, RefreshResponse } from "../../../../packages/contracts/v1";
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
  const payload = await postApi<LoginResponse>(`${input.baseUrl}/v1/auth/login`, {
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
  });

  return {
    tokens: mapTokenPayload(payload.tokens),
  };
}

export async function logoutWithRefreshToken(baseUrl: string, refreshToken: string): Promise<void> {
  await postApi(`${baseUrl}/v1/auth/logout`, {
    refresh_token: refreshToken,
    all_sessions: false,
  });
}

type RefreshApiData = RefreshResponse;
type TokenPayload = LoginResponse["tokens"];

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
  const accessToken = payload.access_token;
  const refreshToken = payload.refresh_token;
  const expiresInSeconds = payload.expires_in_seconds;

  if (!accessToken || !refreshToken || !expiresInSeconds) {
    throw new Error("invalid token payload");
  }

  return {
    accessToken,
    refreshToken,
    expiresInSeconds,
  };
}
