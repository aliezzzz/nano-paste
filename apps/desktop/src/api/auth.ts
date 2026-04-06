import { getRememberedDeviceId } from "../auth/store";
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
  deviceId: string;
  tokens: AuthTokenBundle;
}

export async function loginWithPassword(input: LoginInput): Promise<LoginResult> {
  const rememberedDeviceId = getRememberedDeviceId();

  const payload = await postApi<LoginApiData>(`${input.baseUrl}/v1/auth/login`, {
    username: input.username,
    account: input.username,
    password: input.password,
    device_name: "web",
    deviceName: "web",
    remembered_device_id: rememberedDeviceId,
    rememberedDeviceId,
    platform: detectPlatform(),
    client_version: "0.1.0",
    clientVersion: "0.1.0",
  });

  const deviceId = payload.deviceId?.trim() ?? "";
  if (!deviceId) {
    throw new Error("invalid login response: missing deviceId");
  }

  return {
    username: payload.username ?? payload.account ?? input.username,
    deviceId,
    tokens: mapTokenPayload(payload.tokens),
  };
}

export async function refreshWithToken(
  baseUrl: string,
  refreshToken: string,
  deviceId: string,
): Promise<{ deviceId: string; tokens: AuthTokenBundle }> {
  const payload = await postApi<RefreshApiData>(`${baseUrl}/v1/auth/refresh`, {
    refresh_token: refreshToken,
    refreshToken,
  }, deviceId);

  const refreshedDeviceID = payload.deviceId?.trim() ?? "";
  if (!refreshedDeviceID) {
    throw new Error("invalid refresh response: missing deviceId");
  }

  return {
    deviceId: refreshedDeviceID,
    tokens: mapTokenPayload(payload.tokens),
  };
}

export async function logoutWithRefreshToken(baseUrl: string, refreshToken: string, deviceId: string): Promise<void> {
  await postApi(`${baseUrl}/v1/auth/logout`, {
    refresh_token: refreshToken,
    refreshToken,
    all_devices: false,
    allDevices: false,
  }, deviceId);
}

interface LoginApiData {
  username?: string;
  account?: string;
  deviceId: string;
  tokens: TokenPayload;
}

interface RefreshApiData {
  deviceId: string;
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

async function postApi<T>(url: string, body: unknown, deviceId?: string): Promise<T> {
  return request<T>({
    method: "POST",
    url,
    data: body,
    baseURL: "",
    skipBaseUrl: true,
    authRequired: false,
    retryOnUnauthorized: false,
    withDeviceId: false,
    headers: deviceId?.trim()
      ? {
        "X-Device-Id": deviceId,
      }
      : undefined,
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

function detectPlatform(): string {
  const value = navigator.platform.toLowerCase();
  if (value.includes("mac")) return "macos";
  if (value.includes("win")) return "windows";
  if (value.includes("linux")) return "linux";
  return "unknown";
}
