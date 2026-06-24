import { closeDatabase, getDatabase } from './database/connection';
import { KeyGroupService } from './services/key-group.service';
import { KeyService } from './services/key.service';
import { LocaleService } from './services/locale.service';
import { TranslationService } from './services/translation.service';
import type { BLangOptions, BundleResult } from './types';
import { Cache } from './utils/cache';

export class BLang {
  private readonly locales: LocaleService;
  private readonly groups: KeyGroupService;
  private readonly keys: KeyService;
  private readonly translations: TranslationService;
  private readonly cache: Cache<BundleResult>;
  private defaultLocaleCode: string;
  private readonly fallbackLocaleCode: string;

  constructor(options: BLangOptions = {}) {
    const db = getDatabase(options.dbPath);

    this.locales = new LocaleService(db);
    this.groups = new KeyGroupService(db);
    this.keys = new KeyService(db);
    this.translations = new TranslationService(db);

    this.defaultLocaleCode = options.defaultLocale || 'en';
    this.fallbackLocaleCode = options.fallbackLocale || 'en';
    this.cache = new Cache(options.cacheMax || 1000, options.cacheTTL || 60_000);
  }

  addLocale(code: string, name: string, isDefault = false): void {
    this.locales.addLocale(code, name, isDefault);

    if (isDefault) {
      this.defaultLocaleCode = code;
    }

    this.clearCache();
  }

  getLocales() {
    return this.locales.getLocales();
  }

  setDefaultLocale(code: string): void {
    this.locales.setDefaultLocale(code);
    this.defaultLocaleCode = code;
    this.clearCache();
  }

  addKeyGroup(name: string, description?: string): void {
    this.groups.addGroup(name, description);
  }

  getKeyGroups() {
    return this.groups.getGroups();
  }

  addKey(
    key: string,
    defaultValue: string,
    groupName?: string,
    description?: string,
  ): void {
    let groupId: number | undefined;

    if (groupName) {
      const group = this.groups.getGroupByName(groupName);
      if (!group) {
        throw new Error(`Key group "${groupName}" not found`);
      }
      groupId = group.id;
    }

    this.keys.addKey(key, defaultValue, groupId, description);
    this.clearCache();
  }

  getKeys(groupName?: string) {
    if (groupName) {
      return this.keys.getKeysByGroupName(groupName);
    }

    return this.keys.getKeys();
  }

  setTranslation(key: string, localeCode: string, value: string): void {
    const keyObj = this.keys.getKeyByKeyString(key);
    if (!keyObj) {
      throw new Error(`Key "${key}" not found`);
    }

    const locale = this.locales.getLocaleByCode(localeCode);
    if (!locale) {
      throw new Error(`Locale "${localeCode}" not found`);
    }

    this.translations.setTranslation(keyObj.id, locale.id, value);
    this.clearCache();
  }

  getBundle(
    localeCode: string,
    keys?: string[],
    groupName?: string,
  ): BundleResult {
    const cacheKey = this.buildCacheKey(localeCode, keys, groupName);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const locale = this.resolveLocale(localeCode);
    const fallbackLocale = this.resolveLocale(this.fallbackLocaleCode);
    let result: BundleResult;

    if (groupName) {
      result = this.translations.getGroupBundle(
        locale.id,
        fallbackLocale.id,
        groupName,
      );
    } else if (keys && keys.length > 0) {
      result = this.translations.getBundle(
        locale.id,
        fallbackLocale.id,
        keys,
      );
    } else {
      result = { translations: {}, missing: [] };
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  t(key: string, localeCode?: string): string {
    const locale = localeCode || this.defaultLocaleCode;
    return this.getBundle(locale, [key]).translations[key] ?? key;
  }

  getMissingTranslations(localeCode: string): string[] {
    const allKeys = this.keys.getKeys().map((item) => item.key);
    return this.getBundle(localeCode, allKeys).missing;
  }

  clearCache(): void {
    this.cache.clear();
  }

  close(): void {
    this.clearCache();
    closeDatabase();
  }

  private resolveLocale(code: string) {
    const locale = this.locales.getLocaleByCode(code);
    if (locale) {
      return locale;
    }

    const defaultLocale = this.locales.getDefaultLocale();
    if (defaultLocale) {
      return defaultLocale;
    }

    this.locales.addLocale('en', 'English', true);
    return this.locales.getLocaleByCode('en')!;
  }

  private buildCacheKey(
    localeCode: string,
    keys?: string[],
    groupName?: string,
  ): string {
    if (groupName) {
      return `${localeCode}:group:${groupName}`;
    }

    const sortedKeys = [...(keys || [])].sort().join(',');
    return `${localeCode}:keys:${sortedKeys}`;
  }
}
