import type Database from 'better-sqlite3';
import type { Translation } from '../types';

export class TranslationService {
  constructor(private readonly db: Database.Database) {}

  setTranslation(keyId: number, localeId: number, value: string): void {
    this.db
      .prepare(
        `INSERT INTO translations (key_id, locale_id, value, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key_id, locale_id)
         DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      )
      .run(keyId, localeId, value);
  }

  getTranslation(keyId: number, localeId: number): Translation | null {
    return (
      (this.db
        .prepare(
          `SELECT id, key_id as keyId, locale_id as localeId, value, updated_at as updatedAt
           FROM translations
           WHERE key_id = ? AND locale_id = ?`,
        )
        .get(keyId, localeId) as Translation | undefined) ?? null
    );
  }

  getBundle(
    localeId: number,
    fallbackLocaleId: number,
    keys: string[],
  ): { translations: Record<string, string>; missing: string[] } {
    if (keys.length === 0) {
      return { translations: {}, missing: [] };
    }

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `
      SELECT
        tk.key,
        tk.default_value as defaultValue,
        t.value as localeValue,
        tf.value as fallbackValue
      FROM translation_keys tk
      LEFT JOIN translations t
        ON t.key_id = tk.id AND t.locale_id = ?
      LEFT JOIN translations tf
        ON tf.key_id = tk.id AND tf.locale_id = ?
      WHERE tk.key IN (${placeholders})
    `;

    const rows = this.db
      .prepare(sql)
      .all(localeId, fallbackLocaleId, ...keys) as Array<{
      key: string;
      defaultValue: string;
      localeValue: string | null;
      fallbackValue: string | null;
    }>;

    const translations: Record<string, string> = {};
    const missing: string[] = [];
    const foundKeys = new Set<string>();

    for (const row of rows) {
      foundKeys.add(row.key);

      if (row.localeValue) {
        translations[row.key] = row.localeValue;
        continue;
      }

      if (row.fallbackValue) {
        translations[row.key] = row.fallbackValue;
        missing.push(row.key);
        continue;
      }

      translations[row.key] = row.defaultValue;
      missing.push(row.key);
    }

    for (const key of keys) {
      if (!foundKeys.has(key)) {
        translations[key] = key;
        missing.push(key);
      }
    }

    return { translations, missing };
  }

  getGroupBundle(
    localeId: number,
    fallbackLocaleId: number,
    groupName: string,
  ): { translations: Record<string, string>; missing: string[] } {
    const keys = this.db
      .prepare(
        `SELECT tk.key
         FROM translation_keys tk
         INNER JOIN key_groups kg ON kg.id = tk.group_id
         WHERE kg.name = ?
         ORDER BY tk.id`,
      )
      .all(groupName) as Array<{ key: string }>;

    return this.getBundle(
      localeId,
      fallbackLocaleId,
      keys.map((row) => row.key),
    );
  }
}
