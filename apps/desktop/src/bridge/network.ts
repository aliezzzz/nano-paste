import { createRealtimeConnection, type RealtimeStatus } from "../realtime/ws";
import { getCurrentApiBaseUrl } from "../config/runtime";
import { getAuthSession } from "../auth/store";

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
