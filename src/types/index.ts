export interface Locale {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface KeyGroup {
  id: number;
  name: string;
  description?: string | null;
}

export interface TranslationKey {
  id: number;
  key: string;
  groupId?: number | null;
  defaultValue: string;
  description?: string | null;
  createdAt: string;
}

export interface Translation {
  id: number;
  keyId: number;
  localeId: number;
  value: string;
  updatedAt: string;
}

export interface BLangOptions {
  dbPath?: string;
  defaultLocale?: string;
  fallbackLocale?: string;
  cacheMax?: number;
  cacheTTL?: number;
}

export interface BundleResult {
  translations: Record<string, string>;
  missing: string[];
}
