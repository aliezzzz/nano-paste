import type { NanoPasteWsEvent } from "../../../../packages/contracts/v1";

export type RealtimeStatus = "idle" | "connecting" | "open" | "closed" | "reconnecting" | "error";

interface RealtimeOptions {
  apiBaseUrl: string;
  getAccessToken: () => string;
  onEvent: (event: NanoPasteWsEvent) => void;
  onStatusChange: (status: RealtimeStatus) => void;
}

interface RealtimeController {
  connect: () => void;
  disconnect: () => void;
}

export function createRealtimeConnection(options: RealtimeOptions): RealtimeController {
  const MAX_RECONNECT_ATTEMPTS = 5;
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimer: number | null = null;
  let manualClose = false;

  const connect = (): void => {
    const token = options.getAccessToken();
    if (!token) {
      options.onStatusChange("idle");
      return;
    }

    cleanupTimer();
    manualClose = false;
    options.onStatusChange(reconnectAttempts > 0 ? "reconnecting" : "connecting");

    const wsUrl = toWsUrl(options.apiBaseUrl, token);

    ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
      reconnectAttempts = 0;
      options.onStatusChange("open");
    });

    ws.addEventListener("message", (messageEvent) => {
      try {
        const parsed = JSON.parse(String(messageEvent.data)) as Partial<NanoPasteWsEvent>;
        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.event === "item_created" || parsed.event === "item_deleted" || parsed.event === "file_ready")
        ) {
          options.onEvent(parsed as NanoPasteWsEvent);
        }
      } catch {
        // 忽略非 JSON 或非目标事件
      }
    });

    ws.addEventListener("error", () => {
      options.onStatusChange("error");
    });

    ws.addEventListener("close", () => {
      options.onStatusChange("closed");
      ws = null;
      if (manualClose) return;
      reconnectAttempts += 1;
      if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        options.onStatusChange("error");
        return;
      }
      const delay = Math.min(10000, 1000 * 2 ** Math.min(reconnectAttempts, 4));
      reconnectTimer = window.setTimeout(connect, delay);
    });
  };

  const disconnect = (): void => {
    manualClose = true;
    cleanupTimer();
    reconnectAttempts = 0;
    if (ws) {
      ws.close();
      ws = null;
    }
    options.onStatusChange("idle");
  };

  return {
    connect,
    disconnect,
  };

  function cleanupTimer(): void {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }
}

function toWsUrl(apiBaseUrl: string, accessToken: string): string {
  const wsBase = apiBaseUrl.replace(/^http/i, "ws");
  const url = new URL(`${wsBase}/v1/events/ws`);
  // 浏览器 WebSocket 无法直接设置 Authorization header，使用 query token。
  url.searchParams.set("access_token", accessToken);
  return url.toString();
}
