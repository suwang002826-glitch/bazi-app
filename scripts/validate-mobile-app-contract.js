const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const specPath = path.join(root, 'docs', 'superpowers', 'specs', '2026-07-02-mobile-app-transition-design.md');
const commandPath = path.join(root, 'docs', '项目指挥体系.md');

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

console.log('PASS mobile app transition contract');
