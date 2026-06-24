const fs = require('fs');
const path = require('path');
const { BLang } = require('../dist/index.js');

const dbPath = path.join(__dirname, 'demo.sqlite');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const blang = new BLang({ dbPath });

console.log('=== b-lang demo ===\n');

blang.addLocale('uz', "O'zbekcha");
blang.addLocale('ru', 'Русский');

blang.addKeyGroup('common', 'Common strings');
blang.addKeyGroup('auth', 'Authentication');

blang.addKey('welcome', 'Welcome to our application!', 'common');
blang.addKey('login', 'Log In', 'auth');
blang.addKey('logout', 'Log Out', 'auth');
blang.addKey('footer', 'All rights reserved', 'common');

blang.setTranslation('welcome', 'uz', 'Xush kelibsiz!');
blang.setTranslation('login', 'uz', 'Kirish');
blang.setTranslation('welcome', 'ru', 'Добро пожаловать!');

console.log('1) Locales:');
console.log(blang.getLocales());

console.log('\n2) Key groups:');
console.log(blang.getKeyGroups());

console.log('\n3) Single key (t):');
console.log('  en:', blang.t('welcome'));
console.log('  uz:', blang.t('welcome', 'uz'));
console.log('  ru:', blang.t('welcome', 'ru'));

console.log('\n4) Bundle (multiple keys in one request):');
const bundle = blang.getBundle('uz', ['welcome', 'login', 'logout', 'footer']);
console.log('  translations:', bundle.translations);
console.log('  missing:', bundle.missing);

console.log('\n5) Group bundle:');
const groupBundle = blang.getBundle('uz', undefined, 'auth');
console.log('  auth:', groupBundle.translations);

console.log('\n6) Missing translations (uz):');
console.log(blang.getMissingTranslations('uz'));

blang.close();
console.log('\nDemo finished. SQLite file:', dbPath);
