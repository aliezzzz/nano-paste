interface AuthSessionState {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  username: string;
  deviceId: string;
}

interface PersistedAuthSession {
  accessToken?: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  username?: string;
  deviceId?: string;
}

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

const AUTH_STORAGE_KEY = "nanopaste.desktop.auth";
const session: AuthSessionState = {
  accessToken: "",
  refreshToken: "",
  expiresInSeconds: 0,
  username: "",
  deviceId: "",
};

hydrateSession();

export function getAuthSession(): AuthSessionState {
  return { ...session };
}

export function setAuthSession(tokens: TokenBundle, username?: string, deviceId?: string): void {
  session.accessToken = tokens.accessToken;
  session.refreshToken = tokens.refreshToken;
  session.expiresInSeconds = tokens.expiresInSeconds;
  if (username) {
    session.username = username;
  }
  if (deviceId) {
    session.deviceId = deviceId;
  }
  persistSession();
}

export function clearAuthSession(): void {
  session.accessToken = "";
  session.refreshToken = "";
  session.expiresInSeconds = 0;
  session.username = "";
  session.deviceId = "";
  persistSession();
}

export function getDeviceId(): string {
  return session.deviceId;
}

function hydrateSession(): void {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as PersistedAuthSession;
    session.accessToken = parsed.accessToken ?? "";
    session.refreshToken = parsed.refreshToken ?? "";
    session.expiresInSeconds = parsed.expiresInSeconds ?? 0;
    session.username = parsed.username ?? "";
    session.deviceId = parsed.deviceId ?? "";
  } catch {
    clearAuthSession();
  }
}

function persistSession(): void {
  const payload: PersistedAuthSession = {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresInSeconds: session.expiresInSeconds,
    username: session.username,
    deviceId: session.deviceId,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}
