const http = require('http');
const path = require('path');
const { BLang } = require('../dist/index.js');

const PORT = 3456;
const dbPath = path.join(__dirname, 'server.sqlite');

const blang = new BLang({ dbPath });

try {
  blang.addLocale('uz', "O'zbekcha");
} catch {
  // already exists
}

try {
  blang.addKeyGroup('common');
  blang.addKey('welcome', 'Welcome!', 'common');
  blang.addKey('login', 'Log In', 'common');
  blang.setTranslation('welcome', 'uz', 'Xush kelibsiz!');
  blang.setTranslation('login', 'uz', 'Kirish');
} catch {
  // already exists
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'GET' && req.url === '/api/blang/locales') {
      res.end(JSON.stringify({ success: true, data: blang.getLocales() }));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/blang/bundle') {
      const body = await readBody(req);
      const { locale, keys, group } = body;
      const result = blang.getBundle(locale || 'en', keys, group);
      res.end(
        JSON.stringify({
          success: true,
          data: result.translations,
          missing: result.missing,
        }),
      );
      return;
    }

    if (req.method === 'GET' && req.url === '/') {
      res.end(
        JSON.stringify({
          message: 'b-lang test server',
          endpoints: {
            locales: 'GET /api/blang/locales',
            bundle: 'POST /api/blang/bundle { "locale": "uz", "keys": ["welcome","login"] }',
          },
        }),
      );
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: String(error) }));
  }
});

server.listen(PORT, () => {
  console.log(`b-lang test server: http://localhost:${PORT}`);
  console.log('Test: curl http://localhost:3456/api/blang/locales');
  console.log(
    'Test: curl -X POST http://localhost:3456/api/blang/bundle -H "Content-Type: application/json" -d \'{"locale":"uz","keys":["welcome","login"]}\'',
  );
});
