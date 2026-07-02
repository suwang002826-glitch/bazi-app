# Mobile App Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the product from WeChat Mini Program primary delivery to a standalone React Native + Expo app while keeping backend calculation authority intact.

**Architecture:** Add a new `apps/mobile` Expo app that calls the existing backend APIs. Keep Bazi calculation, lunar conversion, authority-source tracking, and large data packs in backend/shared code.

**Tech Stack:** React Native, Expo, JavaScript, existing Node backend.

---

## File Structure

- Create: `apps/mobile/package.json` for the Expo app scripts and dependencies.
- Create: `apps/mobile/app.json` for Expo app metadata.
- Create: `apps/mobile/App.js` for the first usable app shell.
- Create: `apps/mobile/src/api/baziApi.js` for backend API calls.
- Create: `apps/mobile/src/screens/BaziInputScreen.js` for the first input flow.
- Create: `apps/mobile/src/screens/BaziResultScreen.js` for result display.
- Create: `apps/mobile/README.md` for local run instructions.
- Modify: `docs/项目指挥体系.md` to mark standalone App as the primary client direction.
- Test: `scripts/validate-mobile-app-contract.js` to confirm app API wrapper endpoints stay aligned with backend paths.

## Task 1: Document Primary Client Switch

**Files:**
- Modify: `docs/项目指挥体系.md`
- Test: `scripts/validate-mobile-app-contract.js`

- [ ] **Step 1: Add a validation script for the app migration contract**

Create `scripts/validate-mobile-app-contract.js` with:

```js
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
assert.ok(commandDoc.includes('App') || commandDoc.includes('移动端'), 'command doc must mention App/mobile direction');

console.log('PASS mobile app transition contract');
```

- [ ] **Step 2: Run the test to verify it fails before updating command doc**

Run:

```powershell
node scripts\validate-mobile-app-contract.js
```

Expected: fail if the command doc does not mention the App/mobile direction.

- [ ] **Step 3: Update `docs/项目指挥体系.md`**

Add a short section:

```md
## 当前客户端方向

项目主客户端已从微信小程序切换为独立 App。

前端同伴优先负责 `apps/mobile` 的 App 页面、交互和结果展示。
后端继续负责排盘算法、农历数据包、权威来源、接口契约和验收。

原 `code/` 微信小程序目录保留为原型参考，不再作为主交付形态。
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```powershell
node scripts\validate-mobile-app-contract.js
```

Expected: `PASS mobile app transition contract`

- [ ] **Step 5: Commit**

Run:

```powershell
git add docs scripts
git commit -m "docs: declare standalone app direction"
```

## Task 2: Scaffold Expo Mobile App

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/App.js`
- Create: `apps/mobile/README.md`

- [ ] **Step 1: Create `apps/mobile/package.json`**

```json
{
  "name": "bazi-mobile-app",
  "version": "0.1.0",
  "private": true,
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.4",
    "expo": "^52.0.0",
    "expo-status-bar": "^2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create `apps/mobile/app.json`**

```json
{
  "expo": {
    "name": "Bazi App",
    "slug": "bazi-app",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#161626"
      }
    }
  }
}
```

- [ ] **Step 3: Create `apps/mobile/App.js`**

```js
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>八字排盘</Text>
          <Text style={styles.subtitle}>精准、稳定、专业的排盘系统</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>App 版已启动</Text>
          <Text style={styles.copy}>
            当前版本先连接后端排盘能力，算法和权威数据仍由后端统一负责。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#161626'
  },
  container: {
    padding: 24
  },
  header: {
    paddingTop: 28,
    paddingBottom: 20
  },
  title: {
    color: '#f5e4a7',
    fontSize: 32,
    fontWeight: '700'
  },
  subtitle: {
    color: '#d8d8e8',
    fontSize: 15,
    marginTop: 8
  },
  panel: {
    borderWidth: 1,
    borderColor: '#38384f',
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#202033'
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700'
  },
  copy: {
    color: '#d8d8e8',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10
  }
});
```

- [ ] **Step 4: Create `apps/mobile/README.md`**

```md
# Bazi Mobile App

This is the standalone App client for the Bazi charting product.

The backend remains responsible for calculation, lunar conversion, data-pack provenance, and validation.

## Run

Start backend:

```powershell
node backend\server.js
```

Start mobile app:

```powershell
cd apps\mobile
npm install
npm run start
```
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/mobile
git commit -m "feat: scaffold expo mobile app"
```

## Task 3: Add API Wrapper

**Files:**
- Create: `apps/mobile/src/api/baziApi.js`
- Modify: `apps/mobile/App.js`
- Test: `scripts/validate-mobile-app-contract.js`

- [ ] **Step 1: Extend contract test**

Add checks that `apps/mobile/src/api/baziApi.js` includes:

```js
assert.ok(api.includes('/bazi/calculate'), 'mobile API client must call calculate endpoint');
assert.ok(api.includes('/bazi/calendar/coverage'), 'mobile API client must call coverage endpoint');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node scripts\validate-mobile-app-contract.js
```

Expected: fail because API wrapper does not exist yet.

- [ ] **Step 3: Create API wrapper**

Create `apps/mobile/src/api/baziApi.js`:

```js
const DEFAULT_BASE_URL = 'http://127.0.0.1:8787';

export function getBackendBaseUrl() {
  return process.env.EXPO_PUBLIC_BAZI_API_BASE_URL || DEFAULT_BASE_URL;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Bazi backend request failed');
    error.code = data.code || 'BAZI_API_ERROR';
    error.statusCode = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

export function calculateBazi(payload) {
  return requestJson('/bazi/calculate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getCalendarCoverage() {
  return requestJson('/bazi/calendar/coverage', {
    method: 'GET'
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
node scripts\validate-mobile-app-contract.js
```

Expected: `PASS mobile app transition contract`

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/mobile scripts
git commit -m "feat: add mobile backend api wrapper"
```

## Verification

Run before PR:

```powershell
node scripts\validate-mobile-app-contract.js
node scripts\validate-bazi-backend-service.test.js
node scripts\validate-bazi-backend-client-integration.test.js
node scripts\validate-bazi-acceptance.js
```

Expected:

- `PASS mobile app transition contract`
- `PASS bazi backend service contract`
- `PASS bazi backend-client HTTP integration`
- all BZI acceptance cases pass
