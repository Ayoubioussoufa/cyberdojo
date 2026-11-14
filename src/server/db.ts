/**
 * The database, through libSQL: a plain SQLite file on this computer (set
 * CYBERDOJO_DB to move it), or a hosted Turso database when TURSO_DATABASE_URL
 * and TURSO_AUTH_TOKEN are set, which is what a host without a disk needs.
 * It is opened on first use, so `next build` never touches it.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { DESKTOP } from "@/lib/desktop";

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
CREATE TABLE IF NOT EXISTS feedback (
  path       TEXT NOT NULL,
  visitor    TEXT NOT NULL,
  lang       TEXT NOT NULL,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  helpful    INTEGER NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (visitor, path)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS feedback_path ON feedback(path);
CREATE INDEX IF NOT EXISTS feedback_recent ON feedback(created_at);
CREATE TABLE IF NOT EXISTS certificates (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  belt      INTEGER NOT NULL,
  name      TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  UNIQUE (user_id, belt)
);
`;

/** The desktop app's own tables: tutor chats, graded answers, settings and the search vectors. */
const DESKTOP_SCHEMA = `
CREATE TABLE IF NOT EXISTS tutor_messages (
  id         INTEGER PRIMARY KEY,
  page       TEXT NOT NULL,
  role       TEXT NOT NULL,
  mode       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tutor_messages_page ON tutor_messages(page, id);
CREATE TABLE IF NOT EXISTS tutor_grades (
  id          INTEGER PRIMARY KEY,
  page        TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer      TEXT NOT NULL,
  verdict     TEXT NOT NULL,
  score       INTEGER NOT NULL,
  feedback    TEXT NOT NULL,
  model       TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tutor_grades_question ON tutor_grades(question_id, id);
CREATE TABLE IF NOT EXISTS tutor_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS tutor_vectors (
  chunk  TEXT NOT NULL,
  model  TEXT NOT NULL,
  vector BLOB NOT NULL,
  PRIMARY KEY (chunk, model)
) WITHOUT ROWID;
`;

export type Arg = string | number | null | Uint8Array;
export type Statement = [sql: string, ...args: Arg[]];
type Row = Record<string, unknown>;

const slot = globalThis as { __cyberdojoDb?: Promise<Client> };

async function open(): Promise<Client> {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    const remote = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    await remote.executeMultiple(SCHEMA);
    return remote;
  }
  const file = process.env.CYBERDOJO_DB ?? path.join(process.cwd(), "data", "cyberdojo.db");
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const local = createClient({ url: `file:${file}` });
  await local.executeMultiple(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; ${SCHEMA}${DESKTOP ? DESKTOP_SCHEMA : ""}`);
  return local;
}

/** One client per process. A failed start is forgotten, so the next request tries again. */
function db(): Promise<Client> {
  return (slot.__cyberdojoDb ??= open().catch((e: unknown) => {
    delete slot.__cyberdojoDb;
    throw e;
  }));
}

const plain = (rs: { columns: string[]; rows: ArrayLike<unknown>[] }): Row[] => rs.rows.map((row) => Object.fromEntries(rs.columns.map((c, i) => [c, row[i]])));

export async function all<T = Row>(sql: string, ...args: Arg[]): Promise<T[]> {
  return plain(await (await db()).execute({ sql, args })) as T[];
}

export async function get<T = Row>(sql: string, ...args: Arg[]): Promise<T | undefined> {
  return (await all<T>(sql, ...args))[0];
}

/** Runs a change and says how many rows it touched. */
export async function run(sql: string, ...args: Arg[]): Promise<number> {
  return (await (await db()).execute({ sql, args })).rowsAffected;
}

/**
 * Several statements in one trip to the database. Writes are one transaction:
 * all of them happen or none. Nothing here leans on foreign-key cascades, which
 * a hosted database may not enforce: related rows are always removed by name.
 */
export async function many(statements: Statement[], mode: "write" | "read" = "write"): Promise<Row[][]> {
  const out = await (await db()).batch(statements.map(([sql, ...args]) => ({ sql, args })), mode);
  return out.map(plain);
}
