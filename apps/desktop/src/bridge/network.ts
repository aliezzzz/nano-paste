import { createRealtimeConnection, type RealtimeStatus } from "../realtime/ws";
import { ApiClient } from "../api/client";
import { getCurrentApiBaseUrl } from "../config/runtime";
import { getAuthSession, getDeviceId, setAuthSession } from "../auth/store";
import { refreshWithToken } from "../api/auth";

interface CreateRealtimeDeps {
  onEvent: () => void;
  onStatusChange: (status: RealtimeStatus) => void;
}

export function createBridgeRealtime(deps: CreateRealtimeDeps): ReturnType<typeof createRealtimeConnection> {
  return createRealtimeConnection({
    apiBaseUrl: getCurrentApiBaseUrl(),
    getAccessToken: () => getAuthSession().accessToken,
    onEvent: deps.onEvent,
    onStatusChange: deps.onStatusChange,
  });
}

export function createBridgeApiClient(onUnauthorized: () => void): ApiClient {
  return new ApiClient({
    baseUrl: getCurrentApiBaseUrl(),
    getAccessToken: () => getAuthSession().accessToken,
    getDeviceId,
    onUnauthorized,
    refreshAccessToken: async () => {
      const session = getAuthSession();
      if (!session.refreshToken || !session.deviceId) {
        return false;
      }

      try {
        const refreshed = await refreshWithToken(getCurrentApiBaseUrl(), session.refreshToken, session.deviceId);
        setAuthSession(refreshed.tokens, session.username, refreshed.deviceId);
        return true;
      } catch {
        return false;
      }
    },
  });
}
