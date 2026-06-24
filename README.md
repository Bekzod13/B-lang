# b-lang

A lightweight backend multilanguage package. Stores locales, keys, and translations in SQLite. Fetch multiple keys in a single bundle request — ideal for frontend integration.

## Installation

```bash
npm install @bekzod1313/b-lang
```

## Usage

```typescript
import { BLang } from '@bekzod1313/b-lang';

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
import { BLang } from '@bekzod1313/b-lang';

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

## React frontend example (API)

The frontend loads all page strings in **one request** via the bundle endpoint.

### 1. API client

```typescript
// lib/blang-api.ts
const API_URL = 'http://localhost:3000/api/blang';

type BundleResponse = {
  success: boolean;
  data: Record<string, string>;
  missing: string[];
};

export async function fetchLocales() {
  const res = await fetch(`${API_URL}/locales`);
  return res.json();
}

export async function fetchBundle(locale: string, keys: string[]) {
  const res = await fetch(`${API_URL}/bundle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locale, keys }),
  });

  const json = (await res.json()) as BundleResponse;
  return json.data;
}
```

### 2. React context + hook

```tsx
// context/BLangProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchBundle } from '../lib/blang-api';

type BLangContextValue = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  loading: boolean;
};

const BLangContext = createContext<BLangContextValue | null>(null);

const PAGE_KEYS = ['welcome', 'login', 'footer'];

export function BLangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const data = await fetchBundle(locale, PAGE_KEYS);
      if (active) {
        setTranslations(data);
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [locale]);

  const t = useCallback(
    (key: string) => translations[key] ?? key,
    [translations],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, loading }),
    [locale, t, loading],
  );

  return (
    <BLangContext.Provider value={value}>{children}</BLangContext.Provider>
  );
}

export function useBLang() {
  const ctx = useContext(BLangContext);
  if (!ctx) {
    throw new Error('useBLang must be used within BLangProvider');
  }
  return ctx;
}
```

### 3. Page component

```tsx
// App.tsx
import { BLangProvider, useBLang } from './context/BLangProvider';

function HomePage() {
  const { locale, setLocale, t, loading } = useBLang();

  if (loading) {
    return <p>Loading translations...</p>;
  }

  return (
    <main>
      <h1>{t('welcome')}</h1>
      <button>{t('login')}</button>
      <footer>{t('footer')}</footer>

      <div>
        <button onClick={() => setLocale('en')}>English</button>
        <button onClick={() => setLocale('uz')}>O'zbekcha</button>
        <button onClick={() => setLocale('ru')}>Русский</button>
      </div>

      <p>Current locale: {locale}</p>
    </main>
  );
}

export default function App() {
  return (
    <BLangProvider>
      <HomePage />
    </BLangProvider>
  );
}
```

### How it works

1. Backend exposes `POST /api/blang/bundle` (see Express example above).
2. On mount or locale change, React sends **one request** with all required keys.
3. `t('key')` reads from in-memory state — no extra API calls per string.
4. Switching locale triggers a new bundle fetch for the selected language.

> **Tip:** For production, add CORS on the backend (`cors` package) and point `API_URL` to your real API host.

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
