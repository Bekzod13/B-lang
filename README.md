# b-lang

A lightweight backend multilanguage package. Stores locales, keys, and translations in SQLite. Fetch multiple keys in a single bundle request — ideal for frontend integration.

## Installation

```bash
npm install b-lang
```

## Usage

```typescript
import { BLang } from 'b-lang';

const blang = new BLang({
  dbPath: './data/blang.sqlite',
  defaultLocale: 'en',
  fallbackLocale: 'en',
  cacheMax: 1000,
  cacheTTL: 60_000,
});

// Add locales
blang.addLocale('uz', "O'zbekcha");
blang.addLocale('ru', 'Русский');

// Add key groups and keys
blang.addKeyGroup('common', 'Common strings');
blang.addKey('welcome', 'Welcome to our application!', 'common');
blang.addKey('login', 'Log In', 'common');

// Add translations
blang.setTranslation('welcome', 'uz', 'Xush kelibsiz!');
blang.setTranslation('login', 'uz', 'Kirish');

// Fetch a bundle (primary API method)
const { translations, missing } = blang.getBundle('uz', [
  'welcome',
  'login',
]);

console.log(translations);
// { welcome: 'Xush kelibsiz!', login: 'Kirish' }

console.log(missing);
// []

// Single key lookup
console.log(blang.t('welcome', 'uz'));
// Xush kelibsiz!
```

## Express API example

```typescript
import express from 'express';
import { BLang } from 'b-lang';

const app = express();
const blang = new BLang();

app.use(express.json());

app.post('/api/blang/bundle', (req, res) => {
  const { locale, keys, group } = req.body as {
    locale: string;
    keys?: string[];
    group?: string;
  };

  const result = blang.getBundle(locale, keys, group);
  res.json({
    success: true,
    data: result.translations,
    missing: result.missing,
  });
});

app.get('/api/blang/locales', (_req, res) => {
  res.json(blang.getLocales());
});

app.listen(3000);
```

## API

| Method | Description |
|--------|-------------|
| `addLocale(code, name, isDefault?)` | Add a new locale |
| `getLocales()` | List all locales |
| `setDefaultLocale(code)` | Set the default locale |
| `addKeyGroup(name, description?)` | Add a key group |
| `getKeyGroups()` | List all key groups |
| `addKey(key, defaultValue, groupName?, description?)` | Add a translation key |
| `getKeys(groupName?)` | List keys (optionally by group) |
| `setTranslation(key, locale, value)` | Set a translation |
| `getBundle(locale, keys?, groupName?)` | Fetch multiple keys in one request |
| `t(key, locale?)` | Shorthand for a single key |
| `getMissingTranslations(locale)` | List keys missing translations |
| `clearCache()` | Clear the in-memory cache |
| `close()` | Close the SQLite connection |

## Why b-lang?

- **Backend-first** — translations live in SQLite, not static JSON files
- **Lightweight** — single dependency: `better-sqlite3`
- **Fast** — LRU cache with TTL and batch bundle API
- **One API call for the frontend** — pass `keys[]` and get all strings at once

## Scripts

```bash
npm run build   # Compile TypeScript
npm run demo    # Run a local console demo
npm run server  # Start a test HTTP server on port 3456
```

## License

MIT
