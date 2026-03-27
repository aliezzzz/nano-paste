PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  account TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  client_version TEXT,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT,
  refresh_token TEXT NOT NULL UNIQUE,
  access_expires_at TEXT,
  refresh_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS file_objects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  sha256 TEXT,
  etag TEXT,
  storage_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  category TEXT NOT NULL DEFAULT 'other',
  retention_until TEXT NOT NULL,
  ready_at TEXT,
  cleaned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clipboard_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  file_id TEXT,
  created_by_device_id TEXT,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES file_objects(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_device_id) REFERENCES devices(id) ON DELETE SET NULL,
  CHECK (type IN ('text', 'file'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  item_id TEXT,
  file_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES clipboard_items(id) ON DELETE SET NULL,
  FOREIGN KEY (file_id) REFERENCES file_objects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sync_cursors (
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  last_event_id INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, device_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_user_created
  ON clipboard_items(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_user_id
  ON events(user_id, id);

CREATE INDEX IF NOT EXISTS idx_file_objects_retention
  ON file_objects(retention_until, cleaned_at);

CREATE INDEX IF NOT EXISTS idx_file_objects_user_category
  ON file_objects(user_id, category);

