import type Database from 'better-sqlite3';
import type { KeyGroup } from '../types';

export class KeyGroupService {
  constructor(private readonly db: Database.Database) {}

  addGroup(name: string, description?: string): void {
    this.db
      .prepare(`INSERT INTO key_groups (name, description) VALUES (?, ?)`)
      .run(name, description ?? null);
  }

  getGroups(): KeyGroup[] {
    return this.db
      .prepare(`SELECT id, name, description FROM key_groups ORDER BY id`)
      .all() as KeyGroup[];
  }

  getGroupByName(name: string): KeyGroup | null {
    return (
      (this.db
        .prepare(`SELECT id, name, description FROM key_groups WHERE name = ?`)
        .get(name) as KeyGroup | undefined) ?? null
    );
  }
}
