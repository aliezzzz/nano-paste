import http from 'node:http';
import { URL } from 'node:url';

import express, { type NextFunction, type Request, type Response } from 'express';
import { WebSocketServer, type WebSocket } from 'ws';

import type {
  ApiFailure,
  ApiSuccess,
  DeviceInfo,
  ErrorCode,
  FileReadyEvent,
  ItemCreatedEvent,
  ItemDeletedEvent,
  ItemDetail,
  ItemSummary,
  LoginResponse,
  NanoPasteWsEvent,
  RefreshResponse,
} from '../../contracts/v1/index.js';
import {
  FILE_RETENTION_DAYS,
  getAccountDevices,
  getAccountFiles,
  getAccountItems,
  newId,
  nowIso,
  plusDaysIso,
  runRetentionCleanup,
  store,
} from './store.js';

type ApiOk<T> = ApiSuccess<T>;
type ApiErr = ApiFailure;

type AccountSocket = WebSocket & { accountId: string };

declare global {
  namespace Express {
    interface Request {
      accountId?: string;
    }
  }
}

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ noServer: true });

const PORT = Number(process.env.MOCK_SERVER_PORT ?? 3100);

app.use(express.json());

function ok<T>(data: T): ApiOk<T> {
  return {
    ok: true,
    data,
    requestId: newId('req'),
  };
}

function fail(code: ErrorCode, message: string): ApiErr {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

function toAccountId(account: string): string {
  return `acc_${account.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

function accessTokenOf(accountId: string): string {
  return `mock_access::${accountId}::${newId('atk')}`;
}

function refreshTokenOf(accountId: string): string {
  return `mock_refresh::${accountId}::${newId('rtk')}`;
}

function parseAccessToken(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^mock_access::(.+?)::/);
  return match?.[1] ?? null;
}

function authGuard(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization') ?? '';
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  const accountId = parseAccessToken(bearer);

  if (!accountId) {
    res.status(401).json(fail('UNAUTHORIZED', 'Missing or invalid access token'));
    return;
  }

  req.accountId = accountId;
  next();
}

function requireAccountId(req: Request): string {
  if (!req.accountId) {
    throw new Error('accountId missing after authGuard');
  }
  return req.accountId;
}

function broadcast(event: NanoPasteWsEvent): void {
  for (const client of wsServer.clients) {
    const ws = client as AccountSocket;
    if (ws.readyState !== ws.OPEN) continue;
    if (ws.accountId !== event.accountId) continue;
    ws.send(JSON.stringify(event));
  }
}

app.get('/health', (_req, res) => {
  res.json(ok({ status: 'ok', service: 'mock-server' }));
});

// auth
app.post('/v1/auth/login', (req, res) => {
  const account = String(req.body?.account ?? '').trim();
  const password = String(req.body?.password ?? '').trim();

  if (!account || !password) {
    res.status(400).json(fail('VALIDATION_ERROR', 'account/password required'));
    return;
  }

  const accountId = toAccountId(account);
  const accessToken = accessTokenOf(accountId);
  const refreshToken = refreshTokenOf(accountId);

  store.refreshTokens.set(refreshToken, accountId);

  const payload: LoginResponse = {
    userId: `user_${accountId}`,
    account,
    tokens: {
      accessToken,
      refreshToken,
      expiresInSeconds: 3600,
    },
  };

  res.json(ok(payload));
});

app.post('/v1/auth/refresh', (req, res) => {
  const refreshToken = String(req.body?.refreshToken ?? '');
  const accountId = store.refreshTokens.get(refreshToken);

  if (!accountId) {
    res.status(401).json(fail('UNAUTHORIZED', 'refreshToken invalid'));
    return;
  }

  const payload: RefreshResponse = {
    tokens: {
      accessToken: accessTokenOf(accountId),
      refreshToken,
      expiresInSeconds: 3600,
    },
  };

  res.json(ok(payload));
});

app.post('/v1/auth/logout', (req, res) => {
  const refreshToken = String(req.body?.refreshToken ?? '');
  const allDevices = Boolean(req.body?.allDevices);
  const accountId = store.refreshTokens.get(refreshToken);

  if (refreshToken && accountId) {
    if (allDevices) {
      for (const [token, tokenAccountId] of store.refreshTokens.entries()) {
        if (tokenAccountId === accountId) {
          store.refreshTokens.delete(token);
        }
      }
    } else {
      store.refreshTokens.delete(refreshToken);
    }
  }

  res.json(ok({ success: true as const }));
});

app.use('/v1', authGuard);

// items
app.post('/v1/items', (req, res) => {
  const accountId = requireAccountId(req);
  const content = String(req.body?.content ?? '').trim();
  const title = req.body?.title ? String(req.body.title) : undefined;

  if (req.body?.type !== 'text' || !content) {
    res.status(400).json(fail('VALIDATION_ERROR', 'only text item is supported in create API'));
    return;
  }

  const createdAt = nowIso();
  const itemId = newId('item');
  const item: ItemDetail = {
    id: itemId,
    type: 'text',
    title,
    content,
    createdAt,
    createdByDeviceId: req.header('x-device-id') ?? 'device_mock',
  };

  const items = getAccountItems(accountId);
  items.set(itemId, item);

  const event: ItemCreatedEvent = {
    event: 'item_created',
    accountId,
    timestamp: createdAt,
    payload: {
      itemId,
      type: 'text',
      createdAt,
    },
  };
  broadcast(event);

  res.status(201).json(ok({ item }));
});

app.get('/v1/items', (req, res) => {
  const accountId = requireAccountId(req);
  const type = req.query.type === 'file' || req.query.type === 'text' ? req.query.type : undefined;
  const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100);
  const offset = Number(req.query.cursor ?? 0) || 0;

  const items = [...getAccountItems(accountId).values()]
    .filter((item) => (type ? item.type === type : true))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageItems = items.slice(offset, offset + limit);
  const summaries: ItemSummary[] = pageItems.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    createdAt: item.createdAt,
    createdByDeviceId: item.createdByDeviceId,
  }));

  const nextOffset = offset + summaries.length;
  const hasMore = nextOffset < items.length;

  res.json(
    ok({
      items: summaries,
      page: {
        nextCursor: hasMore ? String(nextOffset) : undefined,
        hasMore,
      },
    }),
  );
});

app.get('/v1/items/:itemId', (req, res) => {
  const accountId = requireAccountId(req);
  const item = getAccountItems(accountId).get(req.params.itemId);

  if (!item) {
    res.status(404).json(fail('NOT_FOUND', 'item not found'));
    return;
  }

  res.json(ok({ item }));
});

app.delete('/v1/items/:itemId', (req, res) => {
  const accountId = requireAccountId(req);
  const items = getAccountItems(accountId);
  const item = items.get(req.params.itemId);

  if (!item) {
    res.status(404).json(fail('NOT_FOUND', 'item not found'));
    return;
  }

  items.delete(req.params.itemId);
  const deletedAt = nowIso();

  const event: ItemDeletedEvent = {
    event: 'item_deleted',
    accountId,
    timestamp: deletedAt,
    payload: {
      itemId: req.params.itemId,
      deletedAt,
    },
  };
  broadcast(event);

  res.json(ok({ success: true as const, deletedAt }));
});

// files
app.post('/v1/files/prepare-upload', (req, res) => {
  const accountId = requireAccountId(req);

  const fileName = String(req.body?.fileName ?? '').trim();
  const fileSize = Number(req.body?.fileSize ?? 0);
  const mimeType = req.body?.mimeType ? String(req.body.mimeType) : undefined;
  const sha256 = req.body?.sha256 ? String(req.body.sha256) : undefined;

  if (!fileName || fileSize <= 0) {
    res.status(400).json(fail('VALIDATION_ERROR', 'fileName/fileSize required'));
    return;
  }

  const fileId = newId('file');
  const expiresAt = plusDaysIso(1);

  getAccountFiles(accountId).set(fileId, {
    fileId,
    accountId,
    fileName,
    fileSize,
    mimeType,
    sha256,
    ready: false,
    createdAt: nowIso(),
    retentionUntil: plusDaysIso(FILE_RETENTION_DAYS),
  });

  res.json(
    ok({
      fileId,
      uploadUrl: `https://mock.nanopaste.local/upload/${fileId}`,
      uploadMethod: 'PUT' as const,
      expiresAt,
    }),
  );
});

app.post('/v1/files/complete', (req, res) => {
  const accountId = requireAccountId(req);

  const fileId = String(req.body?.fileId ?? '');
  const etag = req.body?.etag ? String(req.body.etag) : undefined;
  const sha256 = req.body?.sha256 ? String(req.body.sha256) : undefined;

  const fileRecord = getAccountFiles(accountId).get(fileId);
  if (!fileRecord) {
    res.status(404).json(fail('NOT_FOUND', 'file not found'));
    return;
  }

  fileRecord.ready = true;
  fileRecord.etag = etag ?? fileRecord.etag;
  fileRecord.sha256 = sha256 ?? fileRecord.sha256;

  const items = getAccountItems(accountId);
  const itemId = fileRecord.itemId ?? newId('item');
  fileRecord.itemId = itemId;

  const fileItem: ItemDetail = {
    id: itemId,
    type: 'file',
    title: fileRecord.fileName,
    createdAt: nowIso(),
    createdByDeviceId: req.header('x-device-id') ?? 'device_upload',
    fileId,
    fileName: fileRecord.fileName,
    fileSize: fileRecord.fileSize,
    mimeType: fileRecord.mimeType,
  };
  items.set(itemId, fileItem);

  const readyAt = nowIso();
  const event: FileReadyEvent = {
    event: 'file_ready',
    accountId,
    timestamp: readyAt,
    payload: {
      itemId,
      fileId,
      fileName: fileRecord.fileName,
      fileSize: fileRecord.fileSize,
      mimeType: fileRecord.mimeType,
      readyAt,
    },
  };
  broadcast(event);

  res.json(ok({ itemId, fileId, ready: true as const }));
});

app.post('/v1/files/:fileId/prepare-download', (req, res) => {
  const accountId = requireAccountId(req);

  const fileId = req.params.fileId;
  const file = getAccountFiles(accountId).get(fileId);
  if (!file) {
    res.status(404).json(fail('NOT_FOUND', 'file not found'));
    return;
  }

  if (!file.ready) {
    res.status(409).json(fail('CONFLICT', 'file not completed yet'));
    return;
  }

  res.json(
    ok({
      fileId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      downloadUrl: `https://mock.nanopaste.local/download/${fileId}`,
      expiresAt: plusDaysIso(1),
    }),
  );
});

// 主动清理入口（mock 扩展）
app.post('/v1/files/cleanup', (req, res) => {
  const accountId = requireAccountId(req);
  const scope = req.body?.scope === 'global' ? undefined : accountId;
  const result = runRetentionCleanup(scope);

  res.json(
    ok({
      success: true as const,
      rule: `${FILE_RETENTION_DAYS}_days_with_manual_cleanup`,
      removed: result.removed,
      removedFileIds: result.removedFileIds,
      cleanedAt: nowIso(),
    }),
  );
});

// devices
app.post('/v1/devices/register', (req, res) => {
  const accountId = requireAccountId(req);

  const deviceName = String(req.body?.deviceName ?? '').trim();
  const platform = req.body?.platform;

  if (!deviceName || !['macos', 'windows', 'linux', 'unknown'].includes(platform)) {
    res.status(400).json(fail('VALIDATION_ERROR', 'deviceName/platform required'));
    return;
  }

  const now = nowIso();
  const device: DeviceInfo = {
    deviceId: newId('dev'),
    deviceName,
    platform,
    createdAt: now,
    lastSeenAt: now,
  };

  getAccountDevices(accountId).set(device.deviceId, device);
  res.status(201).json(ok({ device }));
});

app.post('/v1/devices/heartbeat', (req, res) => {
  const accountId = requireAccountId(req);

  const deviceId = String(req.body?.deviceId ?? '');
  const device = getAccountDevices(accountId).get(deviceId);
  if (!device || device.revokedAt) {
    res.status(404).json(fail('NOT_FOUND', 'device not found'));
    return;
  }

  const acknowledgedAt = nowIso();
  device.lastSeenAt = acknowledgedAt;

  res.json(ok({ deviceId, acknowledgedAt }));
});

app.get('/v1/devices', (req, res) => {
  const accountId = requireAccountId(req);

  const devices = [...getAccountDevices(accountId).values()].sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
  );

  res.json(ok({ devices }));
});

app.post('/v1/devices/:deviceId/revoke', (req, res) => {
  const accountId = requireAccountId(req);
  const deviceId = req.params.deviceId;

  const device = getAccountDevices(accountId).get(deviceId);
  if (!device) {
    res.status(404).json(fail('NOT_FOUND', 'device not found'));
    return;
  }

  const revokedAt = nowIso();
  device.revokedAt = revokedAt;

  res.json(ok({ success: true as const, revokedAt }));
});

server.on('upgrade', (req, socket, head) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (requestUrl.pathname !== '/ws') {
    socket.destroy();
    return;
  }

  const accountId = parseAccessToken(requestUrl.searchParams.get('accessToken') ?? undefined);
  if (!accountId) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(req, socket, head, (ws) => {
    (ws as AccountSocket).accountId = accountId;
    wsServer.emit('connection', ws, req);
  });
});

wsServer.on('connection', (ws) => {
  const socket = ws as AccountSocket;
  socket.send(
    JSON.stringify({
      event: 'connected',
      accountId: socket.accountId,
      timestamp: nowIso(),
      payload: { message: 'mock ws connected' },
    }),
  );
});

setInterval(() => {
  runRetentionCleanup();
}, 10 * 60 * 1000).unref();

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[mock-server] listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[mock-server] ws endpoint ws://localhost:${PORT}/ws?accessToken=mock_access::<accountId>::...`);
});
