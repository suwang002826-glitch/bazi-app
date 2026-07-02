const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const specPath = path.join(root, 'docs', 'superpowers', 'specs', '2026-07-02-mobile-app-transition-design.md');
const commandPath = path.join(root, 'docs', '项目指挥体系.md');
const mobilePackagePath = path.join(root, 'apps', 'mobile', 'package.json');
const mobileAppConfigPath = path.join(root, 'apps', 'mobile', 'app.json');
const mobileEntryPath = path.join(root, 'apps', 'mobile', 'App.js');
const mobileApiPath = path.join(root, 'apps', 'mobile', 'src', 'api', 'baziApi.js');
const mobileInputScreenPath = path.join(root, 'apps', 'mobile', 'src', 'screens', 'BaziInputScreen.js');
const mobileResultScreenPath = path.join(root, 'apps', 'mobile', 'src', 'screens', 'BaziResultScreen.js');

assert.ok(fs.existsSync(specPath), 'mobile app transition spec must exist');

const spec = fs.readFileSync(specPath, 'utf8');
assert.ok(spec.includes('standalone mobile app'), 'spec must declare standalone app direction');
assert.ok(spec.includes('React Native with Expo'), 'spec must declare React Native with Expo');
assert.ok(spec.includes('POST /bazi/calculate'), 'spec must keep backend calculate API');
assert.ok(spec.includes('GET /bazi/calendar/coverage'), 'spec must keep backend coverage API');

const commandDoc = fs.existsSync(commandPath) ? fs.readFileSync(commandPath, 'utf8') : '';
assert.ok(
  commandDoc.includes('项目主客户端已从微信小程序切换为独立 App。'),
  'command doc must declare standalone App as the primary client'
);
assert.ok(
  commandDoc.includes('原 `code/` 微信小程序目录保留为原型参考'),
  'command doc must keep Mini Program as prototype reference only'
);

assert.ok(fs.existsSync(mobilePackagePath), 'mobile package.json must exist');
assert.ok(fs.existsSync(mobileAppConfigPath), 'mobile app.json must exist');
assert.ok(fs.existsSync(mobileEntryPath), 'mobile App.js must exist');

const mobilePackage = JSON.parse(fs.readFileSync(mobilePackagePath, 'utf8'));
assert.strictEqual(mobilePackage.name, 'bazi-mobile-app', 'mobile package must use expected app name');
assert.ok(mobilePackage.dependencies.expo, 'mobile app must depend on Expo');
assert.ok(mobilePackage.dependencies['react-native'], 'mobile app must depend on React Native');

const mobileEntry = fs.readFileSync(mobileEntryPath, 'utf8');
assert.ok(mobileEntry.includes('getBackendBaseUrl'), 'mobile entry must use the backend API wrapper');
assert.ok(mobileEntry.includes('BaziInputScreen'), 'mobile entry must render the first calculate flow');

assert.ok(fs.existsSync(mobileApiPath), 'mobile backend API wrapper must exist');
const mobileApi = fs.readFileSync(mobileApiPath, 'utf8');
assert.ok(mobileApi.includes('/bazi/calculate'), 'mobile API client must call calculate endpoint');
assert.ok(mobileApi.includes('/bazi/calendar/coverage'), 'mobile API client must call coverage endpoint');
assert.ok(mobileApi.includes('EXPO_PUBLIC_BAZI_API_BASE_URL'), 'mobile API client must support environment base URL');

assert.ok(fs.existsSync(mobileInputScreenPath), 'mobile Bazi input screen must exist');
assert.ok(fs.existsSync(mobileResultScreenPath), 'mobile Bazi result screen must exist');

const mobileInputScreen = fs.readFileSync(mobileInputScreenPath, 'utf8');
assert.ok(mobileInputScreen.includes('八字排盘'), 'mobile input screen must show Bazi app title');
assert.ok(mobileInputScreen.includes('精准、稳定、专业的排盘系统'), 'mobile input screen must keep product core promise');
assert.ok(mobileInputScreen.includes('calculateBazi'), 'mobile input screen must call calculateBazi');
assert.ok(mobileInputScreen.includes('birthTime'), 'mobile input screen must submit birthTime');
assert.ok(mobileInputScreen.includes('calendarType'), 'mobile input screen must submit calendarType');
assert.ok(mobileInputScreen.includes('立即排盘'), 'mobile input screen must expose calculate action');

const mobileResultScreen = fs.readFileSync(mobileResultScreenPath, 'utf8');
assert.ok(mobileResultScreen.includes('四柱'), 'mobile result screen must show four pillars');
assert.ok(mobileResultScreen.includes('calendarProviderInfo'), 'mobile result screen must show authority metadata');

console.log('PASS mobile app transition contract');
