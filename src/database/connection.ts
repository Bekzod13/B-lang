import Database from 'better-sqlite3';
import path from 'path';

let dbInstance: Database.Database | null = null;
let dbPathUsed: string | null = null;

export function getDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath || path.resolve(process.cwd(), 'blang.sqlite');

  if (!dbInstance || (dbPath && dbPathUsed !== resolvedPath)) {
    if (dbInstance) {
      dbInstance.close();
    }

    dbInstance = new Database(resolvedPath);
    dbPathUsed = resolvedPath;
    dbInstance.pragma('journal_mode = WAL');
    runMigrations(dbInstance);
  }

  return dbInstance;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS locales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS key_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS translation_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      group_id INTEGER,
      default_value TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES key_groups(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_id INTEGER NOT NULL,
      locale_id INTEGER NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (key_id) REFERENCES translation_keys(id) ON DELETE CASCADE,
      FOREIGN KEY (locale_id) REFERENCES locales(id) ON DELETE CASCADE,
      UNIQUE(key_id, locale_id)
    );

    CREATE INDEX IF NOT EXISTS idx_translation_keys_key ON translation_keys(key);
    CREATE INDEX IF NOT EXISTS idx_translation_keys_group_id ON translation_keys(group_id);
    CREATE INDEX IF NOT EXISTS idx_translations_key_locale ON translations(key_id, locale_id);
  `);

  const defaultLocale = db
    .prepare(`SELECT id FROM locales WHERE code = 'en'`)
    .get();

  if (!defaultLocale) {
    db.prepare(
      `INSERT INTO locales (code, name, is_default) VALUES (?, ?, ?)`,
    ).run('en', 'English', 1);
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbPathUsed = null;
  }
}
