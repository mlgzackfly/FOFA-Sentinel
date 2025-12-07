import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../../../data');
const DB_PATH = path.join(DB_DIR, 'fofa.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON'); // Enable foreign key constraints
  }
  return db;
}

export function initDatabase(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS query_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      query TEXT NOT NULL,
      query_base64 TEXT NOT NULL,
      fields TEXT,
      page INTEGER DEFAULT 1,
      size INTEGER DEFAULT 100,
      full BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    const hasTaskIdColumn = db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM pragma_table_info('query_history') 
      WHERE name = 'task_id'
    `
      )
      .get() as { count: number };

    if (hasTaskIdColumn.count === 0) {
      db.exec(`ALTER TABLE query_history ADD COLUMN task_id TEXT`);

      const existingRecords = db
        .prepare('SELECT id FROM query_history WHERE task_id IS NULL')
        .all() as { id: number }[];
      const updateStmt = db.prepare('UPDATE query_history SET task_id = ? WHERE id = ?');

      for (const record of existingRecords) {
        updateStmt.run(randomUUID(), record.id);
      }

      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_task_id ON query_history(task_id)`);
    }
  } catch (error) {
    console.error('Error migrating task_id column:', error);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS query_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      history_id INTEGER NOT NULL,
      result_data TEXT NOT NULL,
      total_size INTEGER,
      page INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (history_id) REFERENCES query_history(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS api_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_history_created ON query_history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_results_history ON query_results(history_id);
  `);

  // PoC Scan Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS poc_scan_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      name TEXT,
      description TEXT,
      query TEXT,
      total_hosts INTEGER DEFAULT 0,
      scanned_hosts INTEGER DEFAULT 0,
      vulnerable_count INTEGER DEFAULT 0,
      safe_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // PoC Scan Results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS poc_scan_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      host TEXT NOT NULL,
      vulnerable BOOLEAN,
      status_code INTEGER,
      error TEXT,
      final_url TEXT,
      tested_url TEXT,
      notes TEXT,
      tags TEXT,
      status TEXT DEFAULT 'pending',
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES poc_scan_sessions(session_id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_poc_sessions_created ON poc_scan_sessions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_poc_sessions_status ON poc_scan_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_poc_results_session ON poc_scan_results(session_id);
    CREATE INDEX IF NOT EXISTS idx_poc_results_vulnerable ON poc_scan_results(vulnerable);
    CREATE INDEX IF NOT EXISTS idx_poc_results_host ON poc_scan_results(host);
  `);

  // PoC Scripts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS poc_scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      language TEXT NOT NULL,
      script TEXT NOT NULL,
      parameters TEXT,
      enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_poc_scripts_created ON poc_scripts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_poc_scripts_type ON poc_scripts(type);
    CREATE INDEX IF NOT EXISTS idx_poc_scripts_language ON poc_scripts(language);
    CREATE INDEX IF NOT EXISTS idx_poc_scripts_enabled ON poc_scripts(enabled);
  `);

  // eslint-disable-next-line no-console
  console.log('Database initialized');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
