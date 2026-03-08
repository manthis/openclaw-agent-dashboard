import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH =
  process.env.ACTIVITY_DB_PATH ||
  path.join(os.homedir(), '.openclaw', 'dashboard-activity.db');

const RETENTION_MS = 24 * 60 * 60 * 1000; // 24h

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      ts    INTEGER NOT NULL,
      type  TEXT    NOT NULL,
      summary TEXT  NOT NULL,
      raw   TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
  `);
  return _db;
}

export interface StoredEvent {
  id: number;
  ts: number;
  type: string;
  summary: string;
  raw: string;
}

export function insertEvent(type: string, summary: string, raw: unknown): void {
  try {
    const db = getDb();
    const now = Date.now();
    const cutoff = now - RETENTION_MS;
    db.prepare('DELETE FROM events WHERE ts < ?').run(cutoff);
    db.prepare('INSERT INTO events (ts, type, summary, raw) VALUES (?, ?, ?, ?)').run(
      now,
      type,
      summary,
      JSON.stringify(raw),
    );
  } catch {
    // non-fatal — DB write failures should not crash the SSE stream
  }
}

export function getHistory(limit = 100, since?: number): StoredEvent[] {
  try {
    const db = getDb();
    if (since !== undefined) {
      return db
        .prepare('SELECT * FROM events WHERE ts > ? ORDER BY ts DESC LIMIT ?')
        .all(since, limit) as StoredEvent[];
    }
    return db
      .prepare('SELECT * FROM events ORDER BY ts DESC LIMIT ?')
      .all(limit) as StoredEvent[];
  } catch {
    return [];
  }
}
