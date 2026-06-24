import type Database from 'better-sqlite3';
import type { Locale } from '../types';

export class LocaleService {
  constructor(private readonly db: Database.Database) {}

  addLocale(code: string, name: string, isDefault = false): void {
    if (isDefault) {
      this.db.prepare(`UPDATE locales SET is_default = 0`).run();
    }

    this.db
      .prepare(
        `INSERT INTO locales (code, name, is_default) VALUES (?, ?, ?)`,
      )
      .run(code, name, isDefault ? 1 : 0);
  }

  getLocales(): Locale[] {
    return this.db
      .prepare(
        `SELECT id, code, name, is_default as isDefault, created_at as createdAt
         FROM locales
         ORDER BY id`,
      )
      .all() as Locale[];
  }

  getLocaleByCode(code: string): Locale | null {
    return (
      (this.db
        .prepare(
          `SELECT id, code, name, is_default as isDefault, created_at as createdAt
           FROM locales WHERE code = ?`,
        )
        .get(code) as Locale | undefined) ?? null
    );
  }

  setDefaultLocale(code: string): void {
    this.db.prepare(`UPDATE locales SET is_default = 0`).run();
    const result = this.db
      .prepare(`UPDATE locales SET is_default = 1 WHERE code = ?`)
      .run(code);

    if (result.changes === 0) {
      throw new Error(`Locale "${code}" not found`);
    }
  }

  getDefaultLocale(): Locale | null {
    return (
      (this.db
        .prepare(
          `SELECT id, code, name, is_default as isDefault, created_at as createdAt
           FROM locales WHERE is_default = 1`,
        )
        .get() as Locale | undefined) ?? null
    );
  }
}
