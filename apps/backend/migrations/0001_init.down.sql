PRAGMA foreign_keys = ON;

DROP INDEX IF EXISTS idx_file_objects_user_category;
DROP INDEX IF EXISTS idx_file_objects_retention;
DROP INDEX IF EXISTS idx_events_user_id;
DROP INDEX IF EXISTS idx_items_user_created;

DROP TABLE IF EXISTS sync_cursors;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS clipboard_items;
DROP TABLE IF EXISTS file_objects;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;

