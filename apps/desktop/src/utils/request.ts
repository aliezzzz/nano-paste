import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "../../../../packages/contracts/v1";
import { useAuthStore } from "../stores/auth";
import { useRuntimeStore } from "../stores/runtime";

type RequestErrorCode = "UNKNOWN" | "INVALID_RESPONSE" | "UNAUTHORIZED";

export class RequestError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code: RequestErrorCode | string = "UNKNOWN") {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.code = code;
  }
}

declare module "axios" {
  interface AxiosRequestConfig {
    authRequired?: boolean;
    retryOnUnauthorized?: boolean;
    unwrapEnvelope?: boolean;
    skipBaseUrl?: boolean;
    _retried?: boolean;
  }

  interface InternalAxiosRequestConfig {
    authRequired?: boolean;
    retryOnUnauthorized?: boolean;
    unwrapEnvelope?: boolean;
    skipBaseUrl?: boolean;
    _retried?: boolean;
  }
}

const service: AxiosInstance = axios.create({
  timeout: 15000,
});

let refreshPromise: Promise<boolean> | null = null;
let unauthorizedHandler: () => void = () => {
  const authStore = useAuthStore();
  authStore.clearSession();
};

export function configureRequest(options: { onUnauthorized?: () => void } = {}): void {
  if (options.onUnauthorized) {
    unauthorizedHandler = options.onUnauthorized;
  }
}

service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const next = config;
  const authStore = useAuthStore();
  const runtimeStore = useRuntimeStore();

  if (!next.skipBaseUrl && !next.baseURL) {
    next.baseURL = runtimeStore.apiBaseUrl;
  }

  const headers = next.headers ?? {};
  const authRequired = next.authRequired ?? true;
  if (authRequired) {
    const accessToken = authStore.accessToken;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

	next.headers = headers;
	return next;
});

service.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status ?? 0;

    if (
      config &&
      config.unwrapEnvelope !== false &&
      (config.authRequired ?? true) &&
      (config.retryOnUnauthorized ?? true) &&
      !config._retried &&
      status === 401
    ) {
      config._retried = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return service.request(config);
      }

      unauthorizedHandler();
    }

    throw mapAxiosError(error);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await service.request<ApiResponse<T>, AxiosResponse<ApiResponse<T>>>({
    ...config,
    unwrapEnvelope: config.unwrapEnvelope ?? true,
  });

  const payload = response.data;
  if (!isApiEnvelope(payload)) {
    throw new RequestError(`invalid api response (${response.status})`, response.status, "INVALID_RESPONSE");
  }

  if (!payload.ok) {
    throw new RequestError(
      payload.error?.message ?? `request failed (${response.status})`,
      response.status,
      payload.error?.code ?? "UNKNOWN",
    );
  }

  return payload.data;
}

export async function requestRaw<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return service.request<T, AxiosResponse<T>>({
    ...config,
    unwrapEnvelope: false,
    retryOnUnauthorized: false,
  });
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefreshAccessToken(): Promise<boolean> {
  const authStore = useAuthStore();
  const runtimeStore = useRuntimeStore();

	if (!authStore.refreshToken) {
		return false;
	}
	const refreshSessionVersion = authStore.sessionVersion;
	const refreshTokenBefore = authStore.refreshToken;

	try {
    const response = await service.request<ApiResponse<RefreshApiData>>({
      method: "POST",
      url: "/v1/auth/refresh",
      data: {
        refresh_token: authStore.refreshToken,
        refreshToken: authStore.refreshToken,
      },
		baseURL: runtimeStore.apiBaseUrl,
		authRequired: false,
		retryOnUnauthorized: false,
		});

    const payload = response.data;
    if (!isApiEnvelope(payload) || !payload.ok) {
      return false;
    }

		const sessionChanged =
			authStore.sessionVersion !== refreshSessionVersion
			|| authStore.refreshToken !== refreshTokenBefore;
		if (sessionChanged) {
			return false;
		}

		authStore.setSession(mapTokenPayload(payload.data.tokens), authStore.username);
		return true;
  } catch {
    return false;
  }
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

function mapTokenPayload(payload: TokenPayload): { accessToken: string; refreshToken: string; expiresInSeconds: number } {
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

function mapAxiosError(error: AxiosError): RequestError {
  const status = error.response?.status ?? 0;
  const payload = error.response?.data as ApiResponse<unknown> | null | undefined;

  if (payload && isApiEnvelope(payload) && !payload.ok) {
    return new RequestError(
      payload.error?.message ?? error.message,
      status,
      payload.error?.code ?? "UNKNOWN",
    );
  }

  if (status === 401) {
    return new RequestError(error.message || "unauthorized", status, "UNAUTHORIZED");
  }

  return new RequestError(error.message || "request failed", status, "UNKNOWN");
}

function isApiEnvelope(payload: unknown): payload is ApiResponse<unknown> {
  return payload !== null && typeof payload === "object" && "ok" in payload;
}
