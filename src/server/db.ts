/**
 * The database: one SQLite file, using the driver built into Node. It is opened
 * on first use, so `next build` never touches it. Set CYBERDOJO_DB to move it.
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS progress (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  version    INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  key TEXT NOT NULL,
  at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_key ON attempts(key, at);
CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY,
  visitor    TEXT NOT NULL,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  day        TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  last_at    INTEGER NOT NULL,
  active_ms  INTEGER NOT NULL DEFAULT 0,
  views      INTEGER NOT NULL DEFAULT 0,
  lang       TEXT NOT NULL,
  device     TEXT NOT NULL,
  referrer   TEXT NOT NULL DEFAULT '',
  entry      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS visits_visitor ON visits(visitor, last_at);
CREATE INDEX IF NOT EXISTS visits_day ON visits(day);
CREATE INDEX IF NOT EXISTS visits_user ON visits(user_id);
CREATE TABLE IF NOT EXISTS page_stats (
  day       TEXT NOT NULL,
  path      TEXT NOT NULL,
  views     INTEGER NOT NULL DEFAULT 0,
  active_ms INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
) WITHOUT ROWID;
`;

const slot = globalThis as { __cyberdojoDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (slot.__cyberdojoDb) return slot.__cyberdojoDb;
  const file = process.env.CYBERDOJO_DB ?? path.join(process.cwd(), "data", "cyberdojo.db");
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const conn = new DatabaseSync(file);
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  conn.exec(SCHEMA);
  slot.__cyberdojoDb = conn;
  return conn;
}
