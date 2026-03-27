import type { DeviceInfo, ItemDetail } from '../../contracts/v1/index.js';

export interface FileRecord {
  fileId: string;
  accountId: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  sha256?: string;
  etag?: string;
  ready: boolean;
  itemId?: string;
  createdAt: string;
  retentionUntil: string;
  cleanedAt?: string;
}

export interface MockStore {
  refreshTokens: Map<string, string>;
  itemsByAccount: Map<string, Map<string, ItemDetail>>;
  filesByAccount: Map<string, Map<string, FileRecord>>;
  devicesByAccount: Map<string, Map<string, DeviceInfo>>;
}

export const FILE_RETENTION_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export const store: MockStore = {
  refreshTokens: new Map(),
  itemsByAccount: new Map(),
  filesByAccount: new Map(),
  devicesByAccount: new Map(),
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

export function getAccountItems(accountId: string): Map<string, ItemDetail> {
  const existing = store.itemsByAccount.get(accountId);
  if (existing) return existing;

  const created = new Map<string, ItemDetail>();
  store.itemsByAccount.set(accountId, created);
  return created;
}

export function getAccountFiles(accountId: string): Map<string, FileRecord> {
  const existing = store.filesByAccount.get(accountId);
  if (existing) return existing;

  const created = new Map<string, FileRecord>();
  store.filesByAccount.set(accountId, created);
  return created;
}

export function getAccountDevices(accountId: string): Map<string, DeviceInfo> {
  const existing = store.devicesByAccount.get(accountId);
  if (existing) return existing;

  const created = new Map<string, DeviceInfo>();
  store.devicesByAccount.set(accountId, created);
  return created;
}

export function runRetentionCleanup(accountId?: string): { removed: number; removedFileIds: string[] } {
  const now = Date.now();
  const removedFileIds: string[] = [];

  const targets = accountId
    ? [...store.filesByAccount.entries()].filter(([id]) => id === accountId)
    : [...store.filesByAccount.entries()];

  for (const [accId, filesMap] of targets) {
    for (const [fileId, record] of filesMap.entries()) {
      if (record.cleanedAt) continue;
      if (new Date(record.retentionUntil).getTime() <= now) {
        filesMap.delete(fileId);
        removedFileIds.push(fileId);

        const accountItems = store.itemsByAccount.get(accId);
        if (!accountItems) continue;

        for (const [itemId, item] of accountItems.entries()) {
          if (item.type === 'file' && item.fileId === fileId) {
            accountItems.delete(itemId);
            break;
          }
        }
      }
    }
  }

  return {
    removed: removedFileIds.length,
    removedFileIds,
  };
}
