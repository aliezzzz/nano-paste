import type { ApiResponse } from "../../../../packages/contracts/v1";

interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => string;
  getDeviceId: () => string;
  onUnauthorized: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

interface RequestOptions {
  authRequired?: boolean;
  retryOnUnauthorized?: boolean;
}

interface ApiFailure {
  ok: false;
  error: {
    code?: string;
    message?: string;
  };
}

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code = "UNKNOWN") {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  private readonly options: ApiClientOptions;

  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: ApiClientOptions) {
    this.options = options;
  }

  async request<T>(path: string, init: RequestInit, options: RequestOptions = {}): Promise<T> {
    const authRequired = options.authRequired ?? true;
    const retryOnUnauthorized = options.retryOnUnauthorized ?? true;

    const response = await this.fetchJson(path, init, authRequired);
    if (response.ok) return response.data as T;

    const unauthorized = response.status === 401 || response.code === "UNAUTHORIZED";
    if (authRequired && retryOnUnauthorized && unauthorized) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(path, init, {
          authRequired,
          retryOnUnauthorized: false,
        });
      }

      this.options.onUnauthorized();
    }

    throw new ApiRequestError(response.message, response.status, response.code);
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.options
        .refreshAccessToken()
        .catch(() => false)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  private async fetchJson(
    path: string,
    init: RequestInit,
    authRequired: boolean,
  ): Promise<{ ok: true; data: unknown } | { ok: false; status: number; code: string; message: string }> {
    const accessToken = this.options.getAccessToken();
    const deviceID = this.options.getDeviceId().trim();
    const headers: Record<string, string> = {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(authRequired && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(deviceID ? { "X-Device-Id": deviceID } : {}),
      ...toHeaderRecord(init.headers),
    };

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
    });

    let payload: unknown = null;
    const rawText = await response.text();
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = null;
      }
    }

    if (!payload || typeof payload !== "object" || !("ok" in payload)) {
      return {
        ok: false,
        status: response.status,
        code: "INVALID_RESPONSE",
        message: `invalid api response (${response.status})`,
      };
    }

    const typed = payload as ApiResponse<unknown>;
    if (typed.ok) {
      return { ok: true, data: typed.data };
    }

    const failure = payload as ApiFailure;
    return {
      ok: false,
      status: response.status,
      code: failure.error?.code ?? "UNKNOWN",
      message: failure.error?.message ?? `request failed (${response.status})`,
    };
  }
}

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}
