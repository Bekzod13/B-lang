import type Database from 'better-sqlite3';
import type { TranslationKey } from '../types';

export class KeyService {
  constructor(private readonly db: Database.Database) {}

  addKey(
    key: string,
    defaultValue: string,
    groupId?: number,
    description?: string,
  ): void {
    this.db
      .prepare(
        `INSERT INTO translation_keys (key, default_value, group_id, description)
         VALUES (?, ?, ?, ?)`,
      )
      .run(key, defaultValue, groupId ?? null, description ?? null);
  }

  getKeys(groupId?: number): TranslationKey[] {
    if (groupId !== undefined) {
      return this.db
        .prepare(
          `SELECT id, key, group_id as groupId, default_value as defaultValue,
                  description, created_at as createdAt
           FROM translation_keys
           WHERE group_id = ?
           ORDER BY id`,
        )
        .all(groupId) as TranslationKey[];
    }

    return this.db
      .prepare(
        `SELECT id, key, group_id as groupId, default_value as defaultValue,
                description, created_at as createdAt
         FROM translation_keys
         ORDER BY id`,
      )
      .all() as TranslationKey[];
  }

  getKeysByGroupName(groupName: string): TranslationKey[] {
    return this.db
      .prepare(
        `SELECT tk.id, tk.key, tk.group_id as groupId, tk.default_value as defaultValue,
                tk.description, tk.created_at as createdAt
         FROM translation_keys tk
         INNER JOIN key_groups kg ON kg.id = tk.group_id
         WHERE kg.name = ?
         ORDER BY tk.id`,
      )
      .all(groupName) as TranslationKey[];
  }

  getKeyByKeyString(keyString: string): TranslationKey | null {
    return (
      (this.db
        .prepare(
          `SELECT id, key, group_id as groupId, default_value as defaultValue,
                  description, created_at as createdAt
           FROM translation_keys WHERE key = ?`,
        )
        .get(keyString) as TranslationKey | undefined) ?? null
    );
  }
}
